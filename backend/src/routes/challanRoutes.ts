import { Router } from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  updateChallanStatus,
} from '../controllers/challanController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protect all sales challan routes with JWT authentication
router.use(authenticateToken);

// Sales Challan Express Endpoints
router.get('/', getChallans);
router.get('/:id', getChallanById);
router.post('/', createChallan);
router.patch('/:id/status', updateChallanStatus);

export default router;
