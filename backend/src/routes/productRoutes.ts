import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
} from '../controllers/productController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protect all product routes with JWT authentication
router.use(authenticateToken);

// Product & Inventory Routes
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.post('/:id/stock', adjustStock);

export default router;
