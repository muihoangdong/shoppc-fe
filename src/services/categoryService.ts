import api from './api';
import { Category, ApiResponse } from '../types';

export const categoryService = {
  async getAllCategories(): Promise<Category[]> {
    const response = await api.get<ApiResponse<Category[]>>('/categories');
    return response.data.data;
  },

  async getCategoryById(id: number): Promise<Category> {
    const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data.data;
  },

  async getCategoriesByType(type: string): Promise<Category[]> {
    const categories = await this.getAllCategories();
    return categories.filter(cat => cat.type === type);
  }
};