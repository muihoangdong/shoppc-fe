/** Trạng thái bộ lọc trang danh sách sản phẩm (lọc ngay trên trình duyệt). */
export interface FilterState {
  type: string | null;
  categories: number[];
  brands: string[];
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
}

export const EMPTY_FILTER: FilterState = { type: null, categories: [], brands: [], minPrice: null, maxPrice: null, inStock: false };
