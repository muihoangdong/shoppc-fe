import type { Product } from '../types';
import { priceOf } from './productMeta';

export const PC_PURPOSES = {
  gaming: { label: 'Gaming', match: /\b(gaming|choi game|pc game|game thu)\b/ },
  office: { label: 'Văn phòng', match: /\b(van phong|office|hoc tap|doanh nghiep)\b/ },
  design: { label: 'Đồ họa', match: /\b(do hoa|thiet ke|workstation|render|dung phim|dung video|3d modeling)\b/ },
} as const;

export type PcPurpose = keyof typeof PC_PURPOSES;

export const isPcPurpose = (value: string | null): value is PcPurpose =>
  value !== null && Object.prototype.hasOwnProperty.call(PC_PURPOSES, value);

const normalize = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ');

function matchesPurpose(product: Product, purpose: PcPurpose) {
  const title = normalize(`${product.name} ${product.category_name || ''}`);
  if (/\b(laptop|notebook|macbook|may tinh xach tay)\b/.test(title)) return false;
  const usage = Object.entries(product.specs || {})
    .filter(([key]) => /\b(nhu cau|muc dich|phan loai|usage|purpose|use case)\b/.test(normalize(key)))
    .map(([, value]) => value);
  return PC_PURPOSES[purpose].match.test(`${title} ${normalize(usage.join(' '))}`);
}

export function suggestReadyMadePcs(products: Product[], purpose: PcPurpose, maxPrice: number): Product[] {
  return products
    .filter((product) => {
      const price = priceOf(product);
      return product.category_type === 'pc' && Number(product.stock) > 0 && Number.isFinite(price)
        && price > 0 && price <= maxPrice && matchesPurpose(product, purpose);
    })
    .sort((a, b) => priceOf(b) - priceOf(a) || a.id - b.id)
    .slice(0, 3);
}
