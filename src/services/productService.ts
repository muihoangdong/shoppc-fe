import api from './api';
import { Product, ApiResponse } from '../types';

export const productService = {
  async getProducts(filters?: { category_id?: number; type?: string; search?: string }): Promise<Product[]> {
    const params = new URLSearchParams();
    if (filters?.category_id) params.append('category_id', filters.category_id.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.search) params.append('search', filters.search);
    
    const response = await api.get<ApiResponse<Product[]>>(`/products?${params}`);
    return response.data.data;
  },

  async getProductById(id: number): Promise<Product> {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data;
  },

  async getProductsByType(type: string): Promise<Product[]> {
    const response = await api.get<ApiResponse<Product[]>>(`/products/type/${type}`);
    return response.data.data;
  },

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    const response = await api.get<ApiResponse<Product[]>>(`/products/category/${categoryId}`);
    return response.data.data;
  }
};