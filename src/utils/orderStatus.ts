import type { OrderGroup, OrderStatus } from '../services/orderService';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  processing: 'Đang chuẩn bị hàng',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
};

export const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-200 text-gray-700',
};

export const GROUP_TABS: { value: OrderGroup | ''; label: string; key: 'all' | OrderGroup }[] = [
  { value: '', label: 'Tất cả', key: 'all' },
  { value: 'pending', label: 'Chờ xác nhận', key: 'pending' },
  { value: 'processing', label: 'Đang chuẩn bị', key: 'processing' },
  { value: 'shipped', label: 'Đang giao', key: 'shipped' },
  { value: 'done', label: 'Đã giao', key: 'done' },
  { value: 'cancelled', label: 'Đã hủy', key: 'cancelled' },
];

/** Các bước của một đơn bình thường (dùng cho thanh tiến trình). */
export const STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'pending', label: 'Đặt hàng' },
  { status: 'processing', label: 'Xác nhận & chuẩn bị' },
  { status: 'shipped', label: 'Đang giao' },
  { status: 'delivered', label: 'Đã giao' },
  { status: 'completed', label: 'Hoàn tất' },
];

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  banking: 'Chuyển khoản / VietQR',
  momo: 'Ví MoMo',
  zalopay: 'ZaloPay',
  vnpay: 'VNPay',
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thanh toán lỗi',
  refunded: 'Đã hoàn tiền',
};
