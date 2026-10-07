import { Product } from '../types';

export const SIMILAR_LIMIT = 4;

/**
 * Chọn sản phẩm tương tự: ưu tiên cùng danh mục, thiếu thì lấy cùng loại (PC / linh kiện / phụ kiện).
 * Trong mỗi nhóm: còn hàng trước, rồi giá gần với sản phẩm đang xem nhất.
 */
export function pickSimilar(current: Product, sameCategory: Product[], sameType: Product[], limit = SIMILAR_LIMIT): Product[] {
  const price = Number(current.price);
  const rank = (list: Product[]) =>
    [...list].sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || Math.abs(Number(a.price) - price) - Math.abs(Number(b.price) - price));
  const seen = new Set([current.id]);
  const out: Product[] = [];
  for (const p of [...rank(sameCategory), ...rank(sameType)]) {
    if (out.length >= limit) break;
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}
