import { Router } from 'express';
import { login, getMe } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Auth Endpoints
router.post('/login', login);
router.get('/me', authenticateToken, getMe);

export default router;
