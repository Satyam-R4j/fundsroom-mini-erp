import { api } from './api';

export interface ChallanItem {
  id?: string;
  productId: string;
  productNameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
}

export interface ChallanCustomer {
  id: string;
  name: string;
  businessName: string;
  mobile: string;
  email: string;
  customerType: string;
  address?: string;
  gstNumber?: string;
}

export interface ChallanAuthor {
  id: string;
  name: string;
  role: string;
  email?: string;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  totalQuantity: number;
  totalAmount: number;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customer: ChallanCustomer;
  author: ChallanAuthor;
  items: ChallanItem[];
  _count?: {
    items: number;
  };
}

export interface CreateChallanPayload {
  customerId: string;
  status: 'DRAFT' | 'CONFIRMED';
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export const challanService = {
  // Get list of sales challans with optional filters
  getChallans: async (params?: { q?: string; status?: string }): Promise<Challan[]> => {
    const response = await api.get('/challans', { params });
    return response.data;
  },

  // Get single challan with snapshot items
  getChallanById: async (id: string): Promise<Challan> => {
    const response = await api.get(`/challans/${id}`);
    return response.data;
  },

  // Create new sales challan
  createChallan: async (data: CreateChallanPayload): Promise<{ message: string; challan: Challan }> => {
    const response = await api.post('/challans', data);
    return response.data;
  },

  // Update challan status (DRAFT -> CONFIRMED or CANCELLED)
  updateStatus: async (id: string, status: 'CONFIRMED' | 'CANCELLED' | 'DRAFT'): Promise<{ message: string; challan: Challan }> => {
    const response = await api.patch(`/challans/${id}/status`, { status });
    return response.data;
  },
};
