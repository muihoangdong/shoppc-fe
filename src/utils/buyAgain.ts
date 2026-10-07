import toast from 'react-hot-toast';
import { cartService } from '../services/cartService';
import type { MyOrder } from '../services/orderService';

/** Mua lại: thêm lại các sản phẩm của đơn vào giỏ (sản phẩm hết hàng / đã ngừng bán thì bỏ qua). */
export async function buyAgain(order: MyOrder, refreshCart: () => Promise<void>) {
  let ok = 0;
  for (const item of order.items) {
    try {
      await cartService.addToCart(item.product_id, item.quantity);
      ok += 1;
    } catch {
      /* api.ts đã báo lỗi (hết hàng...) */
    }
  }
  await refreshCart();
  if (ok) toast.success(ok === order.items.length ? 'Đã thêm lại các sản phẩm vào giỏ hàng' : `Đã thêm ${ok}/${order.items.length} sản phẩm vào giỏ hàng`);
}

