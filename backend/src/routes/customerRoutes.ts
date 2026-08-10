import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  addCustomerNote,
} from '../controllers/customerController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protect all customer routes with JWT authentication
router.use(authenticateToken);

// Customer CRM Routes
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.post('/:id/notes', addCustomerNote);

export default router;
