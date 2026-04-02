import api from './api';
import { Cart, ApiResponse, StockValidationResult } from '../types';

const getSessionId = (): string => {
  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${crypto.randomUUID()}`;
    localStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

export const cartService = {
  async getCart(): Promise<Cart> {
    const sessionId = getSessionId();
    const response = await api.get<ApiResponse<Cart>>('/cart', {
      params: { session_id: sessionId }
    });
    return response.data.data;
  },

  async addToCart(product_id: number, quantity: number = 1): Promise<void> {
    const sessionId = getSessionId();
    await api.post('/cart/add', { session_id: sessionId, product_id, quantity });
  },

  async updateCartItem(product_id: number, quantity: number): Promise<void> {
    const sessionId = getSessionId();
    await api.put('/cart/update', { session_id: sessionId, product_id, quantity });
  },

  async removeFromCart(product_id: number): Promise<void> {
    const sessionId = getSessionId();
    await api.delete(`/cart/remove/${product_id}`, {
      data: { session_id: sessionId }
    });
  },

  async clearCart(): Promise<void> {
    const sessionId = getSessionId();
    await api.delete('/cart/clear', {
      data: { session_id: sessionId }
    });
  },

  async checkStock(): Promise<StockValidationResult> {
    const sessionId = getSessionId();
    const response = await api.get<ApiResponse<StockValidationResult>>('/cart/check-stock', {
      params: { session_id: sessionId }
    });
    return response.data.data;
  }
};