import { api } from './api';

export interface StockLogUser {
  id: string;
  name: string;
  role: string;
  email?: string;
}

export interface StockLog {
  id: string;
  productId: string;
  quantityChanged: number;
  movementType: 'IN' | 'OUT';
  reason: string;
  createdBy: string;
  timestamp: string;
  user?: StockLogUser;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string;
  createdAt: string;
  updatedAt: string;
  isLowStock?: boolean;
  stockLogs?: StockLog[];
  _count?: {
    stockLogs: number;
  };
}

export interface CreateProductPayload {
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock?: number;
  minStockAlert?: number;
  location?: string;
}

export interface StockAdjustmentPayload {
  quantityChanged: number;
  movementType: 'IN' | 'OUT';
  reason: string;
}

export const productService = {
  // Get all products with optional filters
  getProducts: async (params?: { q?: string; category?: string; lowStock?: boolean }): Promise<Product[]> => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  // Get product details + stock logs
  getProductById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Create new product
  createProduct: async (data: CreateProductPayload): Promise<{ message: string; product: Product }> => {
    const response = await api.post('/products', data);
    return response.data;
  },

  // Update existing product
  updateProduct: async (id: string, data: Partial<CreateProductPayload>): Promise<{ message: string; product: Product }> => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  // Adjust stock quantity (IN or OUT movement)
  adjustStock: async (id: string, data: StockAdjustmentPayload): Promise<{ message: string; product: Product; log: StockLog }> => {
    const response = await api.post(`/products/${id}/stock`, data);
    return response.data;
  },
};
