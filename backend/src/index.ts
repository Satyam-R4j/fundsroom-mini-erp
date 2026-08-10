import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);

// Server Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Fundsroom Mini ERP & CRM API Server is running smoothly',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`⚡️ [Server]: Fundsroom Mini ERP Backend is running at http://localhost:${PORT}`);
});
