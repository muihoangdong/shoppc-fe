import api from './api';
import { ApiResponse } from '../types';

export interface ReviewSummary {
  average: number;
  count: number;
  /** số đánh giá theo từng mức sao 1..5 */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ProductReview {
  id: number;
  rating: number;
  comment: string | null;
  customer_name: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MyReview {
  id: number;
  rating: number;
  comment: string | null;
  status: 'visible' | 'hidden';
  admin_reply: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewViewer {
  logged_in: boolean;
  can_review: boolean;
  /** Lý do chưa được đánh giá (hiển thị cho khách) */
  reason: string | null;
  code: 'login' | 'waiting' | 'not_bought' | null;
  my_review: MyReview | null;
}

export interface ProductReviewsPage {
  summary: ReviewSummary;
  items: ProductReview[];
  page: number;
  pages: number;
  viewer: ReviewViewer;
}

export const reviewService = {
  async getForProduct(productId: number, page = 1, rating?: number): Promise<ProductReviewsPage> {
    const params: Record<string, number> = { page };
    if (rating) params.rating = rating;
    const res = await api.get<ApiResponse<ProductReviewsPage>>(`/reviews/product/${productId}`, { params, silent: true });
    return res.data.data;
  },

  async submit(productId: number, rating: number, comment: string): Promise<{ message: string; summary: ReviewSummary }> {
    const res = await api.post<ApiResponse<{ summary: ReviewSummary }>>(`/reviews/product/${productId}`, { rating, comment }, { silent: true });
    return { message: res.data.message || 'Đã gửi đánh giá', summary: res.data.data.summary };
  },

  async removeMine(productId: number): Promise<void> {
    await api.delete(`/reviews/product/${productId}/mine`);
  },
};
