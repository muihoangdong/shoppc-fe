import api from './api';
import { ApiResponse, Order } from '../types';

export type OrderStatus = Order['status'];
export type OrderGroup = 'pending' | 'processing' | 'shipped' | 'done' | 'cancelled';

export interface MyOrderItem {
  id?: number;
  product_id: number;
  product_name: string;
  product_image?: string | null;
  quantity: number;
  price: number | string;
  total: number | string;
}

export type MyOrder = Omit<Order, 'admin_note' | 'user_id'> & { coupon_code?: string | null; items: MyOrderItem[] };

export interface MyOrderDetail extends MyOrder {
  /** Các lần đổi trạng thái (cũ → mới). note chỉ có với lần hủy (lý do hủy). */
  history: { status: OrderStatus; at: string; note: string | null }[];
}

export interface MyOrdersPage {
  data: MyOrder[];
  meta: { page: number; limit: number; total: number; pages: number; counts: Record<'all' | OrderGroup, number> };
}

export interface CreateOrderPayload {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  note?: string;
  payment_method: 'cod' | 'banking';
  coupon_code?: string;
  session_id?: string;
}

export interface PaymentInfo {
  order_code: string;
  total_amount: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  status: string;
  /** Nội dung chuyển khoản (mã đơn bỏ dấu gạch) */
  transfer_content: string;
  bank: { bank_name: string; account_no: string; account_name: string } | null;
  /** Ảnh mã VietQR (data URL) — null nếu không cần/không thể thanh toán bằng QR */
  qr_data_url: string | null;
  /** Cửa hàng có bật tự xác nhận khi tiền về không */
  auto_confirm: boolean;
  /** Lúc khách bấm "Tôi đã chuyển khoản" (null nếu chưa báo hoặc cửa hàng báo chưa nhận được tiền) */
  payment_claimed_at: string | null;
}

export const orderService = {
  /** Đơn của khách đang đăng nhập (kể cả đơn đặt lúc chưa đăng nhập cùng email). */
  async getMyOrders(group: OrderGroup | '' = '', page = 1): Promise<MyOrdersPage> {
    const params: Record<string, string | number> = { page };
    if (group) params.group = group;
    const response = await api.get<MyOrdersPage>('/orders/mine', { params, silent: true });
    return response.data;
  },

  async getMyOrder(orderCode: string): Promise<MyOrderDetail> {
    const response = await api.get<ApiResponse<MyOrderDetail>>(`/orders/mine/${encodeURIComponent(orderCode)}`, { silent: true });
    return response.data.data;
  },

  async cancelMyOrder(orderCode: string, reason: string): Promise<MyOrderDetail> {
    const response = await api.post<ApiResponse<MyOrderDetail>>(`/orders/mine/${encodeURIComponent(orderCode)}/cancel`, { reason });
    return response.data.data;
  },

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const session_id = localStorage.getItem('session_id') || undefined;
    const response = await api.post<ApiResponse<Order>>('/orders', { ...payload, session_id });
    return response.data.data;
  },

  // Thông tin thanh toán của đơn (cần đúng SĐT đặt hàng)
  async getPayment(orderCode: string, phone: string, silent = false): Promise<PaymentInfo> {
    const response = await api.get<ApiResponse<PaymentInfo>>(`/orders/payment/${encodeURIComponent(orderCode)}`, { params: { phone }, silent });
    return response.data.data;
  },

  /** Khách báo "Tôi đã chuyển khoản" → cửa hàng được thông báo ngay để kiểm tra và xác nhận. */
  async claimPayment(orderCode: string, phone: string): Promise<{ message: string; data: PaymentInfo }> {
    const response = await api.post<ApiResponse<PaymentInfo>>(`/orders/payment/${encodeURIComponent(orderCode)}/claim`, {}, { params: { phone } });
    return { message: response.data.message || 'Đã báo cửa hàng', data: response.data.data };
  },
};
