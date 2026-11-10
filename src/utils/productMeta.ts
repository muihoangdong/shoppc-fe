import { Product } from '../types';

/** Thông tin hiển thị suy ra từ dữ liệu sản phẩm sẵn có (không cần thêm cột database). */

const BRANDS = [
  'AMD', 'Intel', 'NVIDIA', 'ASUS', 'ROG', 'MSI', 'Gigabyte', 'ASRock', 'Corsair', 'NZXT', 'Samsung', 'Kingston',
  'Western Digital', 'WD', 'Seagate', 'Crucial', 'G.Skill', 'TeamGroup', 'Lexar', 'Cooler Master', 'DeepCool',
  'Thermalright', 'Noctua', 'Lian Li', 'Fractal', 'Phanteks', 'Seasonic', 'be quiet!', 'Xigmatek', 'Logitech',
  'Razer', 'SteelSeries', 'HyperX', 'Dell', 'HP', 'Lenovo', 'Acer', 'LG', 'ViewSonic', 'AOC', 'Apple', 'Akko',
  'Keychron', 'MonsGeek', 'DareU', 'E-Dra', 'Sapphire', 'Zotac', 'Palit', 'Inno3D', 'PNY', 'Colorful', 'Galax',
];

const BRAND_SPEC_KEYS = ['brand', 'thương hiệu', 'thuong hieu', 'hãng', 'hang', 'hãng sản xuất', 'nhà sản xuất', 'manufacturer'];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Thương hiệu: ưu tiên thông số "Thương hiệu/Hãng/Brand", sau đó dò tên hãng quen thuộc trong tên sản phẩm. */
export const getBrand = (p: Pick<Product, 'name' | 'specs' | 'brand_name'>): string | null => {
  if (p.brand_name?.trim()) return p.brand_name.trim();
  for (const [k, v] of Object.entries(p.specs || {})) {
    if (BRAND_SPEC_KEYS.includes(k.trim().toLowerCase()) && String(v).trim()) return String(v).trim();
  }
  const name = ` ${p.name} `;
  for (const b of BRANDS) {
    if (new RegExp(`[\\s(/-]${escapeRe(b)}[\\s)/-]`, 'i').test(name)) return b === 'ROG' ? 'ASUS' : b === 'WD' ? 'Western Digital' : b;
  }
  return null;
};

export const priceOf = (p: Pick<Product, 'price'>): number => Number(p.price) || 0;

/** Giá gốc (chỉ khi lớn hơn giá bán) và % giảm. */
export const getDiscount = (p: Pick<Product, 'price' | 'original_price'>): { original: number; percent: number } | null => {
  const original = Number(p.original_price);
  const price = priceOf(p);
  if (!original || !price || original <= price) return null;
  return { original, percent: Math.round(((original - price) / original) * 100) };
};

export type StockState = 'in' | 'low' | 'out';
export const LOW_STOCK = 5;
export const stockState = (stock: number): StockState => (stock <= 0 ? 'out' : stock <= LOW_STOCK ? 'low' : 'in');
export const STOCK_LABEL: Record<StockState, string> = { in: 'Còn hàng', low: 'Sắp hết', out: 'Tạm hết hàng' };

/** Tối đa n thông số đầu tiên để hiện trên thẻ sản phẩm. */
export const keySpecs = (p: Pick<Product, 'specs'>, n = 2): [string, string][] =>
  Object.entries(p.specs || {})
    .filter(([k, v]) => v !== '' && v !== null && !BRAND_SPEC_KEYS.includes(k.trim().toLowerCase()))
    .slice(0, n)
    .map(([k, v]) => [k.replace(/_/g, ' '), String(v)]);

/** Sản phẩm mới (tạo trong 14 ngày gần đây) */
export const isNew = (p: Pick<Product, 'created_at'>): boolean => {
  const t = new Date(p.created_at).getTime();
  return Number.isFinite(t) && Date.now() - t < 14 * 24 * 3600 * 1000;
};
