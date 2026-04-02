import api from './api';
import { ApiResponse, Order } from '../types';

export interface CreateOrderPayload {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  note?: string;
  payment_method: 'cod' | 'banking';
  session_id?: string;
}

export const orderService = {
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const session_id = localStorage.getItem('session_id') || undefined;
    const response = await api.post<ApiResponse<Order>>('/orders', { ...payload, session_id });
    return response.data.data;
  },
};
