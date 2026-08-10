import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fundsroom_erp_secret_key_2026_secure';

export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

// Extend Express Request interface to include authenticated user context
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

// Generate JWT token valid for 7 days
export const generateToken = (payload: { id: string; email: string; name: string; role: string }) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Middleware to authenticate JWT token from Authorization header
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token missing. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedRequest['user'];
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired session token.' });
  }
};

// Middleware to enforce role-based authorization
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User context not found.' });
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return res.status(403).json({
        message: `Forbidden: Access restricted to ${allowedRoles.join(', ')} roles.`
      });
    }

    next();
  };
};
