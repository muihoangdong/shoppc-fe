import api from './api';
import { ApiResponse } from '../types';

/** Kết quả kiểm tra mã: số tiền do server tính lại từ giỏ hàng thật. */
export interface CouponCheck {
  code: string;
  /** VD: "Giảm 10% (tối đa 500.000₫)" */
  summary: string;
  description: string | null;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total_amount: number;
}

export const couponService = {
  /** Lỗi (mã sai, hết hạn, chưa đủ tối thiểu...) không tự hiện toast: trang thanh toán hiển thị ngay dưới ô nhập. */
  async check(code: string, customer: { phone?: string; email?: string } = {}): Promise<CouponCheck> {
    const session_id = localStorage.getItem('session_id') || undefined;
    const response = await api.post<ApiResponse<CouponCheck>>(
      '/coupons/check',
      { code, session_id, customer_phone: customer.phone || undefined, customer_email: customer.email || undefined },
      { silent: true }
    );
    return response.data.data;
  },
};
