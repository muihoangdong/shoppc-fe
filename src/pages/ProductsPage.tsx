import { customerService, SpecTemplate } from '../services/customerService';
import { buildSpecFacets, matchesSpecFilters } from '../utils/specFilters';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  Squares2X2Icon,
  ListBulletIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckBadgeIcon,
  ShieldCheckIcon,
  BoltIcon,
  WrenchScrewdriverIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { Product, Category } from '../types';
import ProductCard from '../components/Products/ProductCard';
import ProductFilter, { ActiveFilters } from '../components/Products/ProductFilter';
import { EMPTY_FILTER, FilterState } from '../components/Products/filterState';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getBrand, priceOf } from '../utils/productMeta';

const PAGE_SIZE = 12;

const SORTS = {
  popular: { label: 'Phổ biến nhất', fn: null },
  newest: { label: 'Mới nhất', fn: (a: Product, b: Product) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime() },
  'price-asc': { label: 'Giá thấp → cao', fn: (a: Product, b: Product) => priceOf(a) - priceOf(b) },
  'price-desc': { label: 'Giá cao → thấp', fn: (a: Product, b: Product) => priceOf(b) - priceOf(a) },
  name: { label: 'Tên A → Z', fn: (a: Product, b: Product) => a.name.localeCompare(b.name, 'vi') },
} as const;
type SortKey = keyof typeof SORTS;

const TYPE_TITLE: Record<string, string> = { pc: 'Máy Tính Nguyên Bộ', component: 'Linh Kiện Máy Tính', peripheral: 'Phụ Kiện & Gaming Gear' };

// Lần tải gần nhất: bấm Quay lại từ trang chi tiết thì danh sách hiện ngay (không qua vòng xoay) để cuộn về đúng chỗ cũ, rồi cập nhật ngầm
let lastLoad: { search: string | null; products: Product[]; categories: Category[] } | null = null;

// Trang / bộ lọc / sắp xếp lưu theo từng mục lịch sử trình duyệt (location.key): Quay lại thì về đúng trang đang xem
type SavedView = { filter: FilterState; sort: SortKey; page: number };
const viewKey = (key: string) => `shoppc_products_state:${key}`;
const readView = (key: string): SavedView | null => {
  try {
    const raw = sessionStorage.getItem(viewKey(key));
    return raw ? (JSON.parse(raw) as SavedView) : null;
  } catch {
    return null;
  }
};

const ProductsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [saved] = useState(() => readView(location.key));
  const cached = lastLoad && lastLoad.search === searchParams.get('search') ? lastLoad : null;
  const [templates, setTemplates] = useState<SpecTemplate[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const filterDialog = useRef<HTMLDivElement>(null);
  const [specError, setSpecError] = useState(false);
  const [products, setProducts] = useState<Product[]>(cached?.products ?? []);
  const [categories, setCategories] = useState<Category[]>(cached?.categories ?? []);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);
  const latest = useRef(0);
  const typeParam = searchParams.get('type');
  const searchParam = searchParams.get('search');
  // ?category=<id> (từ "Xem thêm" ở mục Sản phẩm tương tự) chọn sẵn danh mục
  const categoryParam = Number(searchParams.get('category')) || null;

  const [filter, setFilterState] = useState<FilterState>(
    () => saved?.filter ?? { ...EMPTY_FILTER, type: typeParam, categories: categoryParam ? [categoryParam] : [] }
  );
  const [sort, setSortState] = useState<SortKey>(saved?.sort ?? 'popular');
  const [view, setView] = useLocalStorage<'grid' | 'list'>('shoppc_products_view', 'grid');
  const [page, setPage] = useState(saved?.page ?? 1);
  const [filtersOpen, setFiltersOpen] = useState(false); // điện thoại: ngăn kéo bộ lọc

  useEffect(() => {
    if (!filtersOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    filterDialog.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFiltersOpen(false);
      if (e.key !== 'Tab') return;
      const controls = [...(filterDialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]') || [])].filter((el) => el.getClientRects().length);
      const first = controls[0], last = controls[controls.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === filterDialog.current)) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || document.activeElement === filterDialog.current)) { e.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', key); previous?.focus(); };
  }, [filtersOpen]);

  // Đổi bộ lọc / sắp xếp thì về trang 1 (làm ngay khi đổi, không dùng effect để không xóa trang đã khôi phục khi Quay lại)
  const setFilter = (next: FilterState) => {
    setFilterState({ ...next, specs: next.type !== filter.type || next.categories.join(',') !== filter.categories.join(',') ? {} : next.specs });
    setPage(1);
  };
  const setSort = (next: SortKey) => {
    setSortState(next);
    setPage(1);
  };

  // Đổi link trên thanh menu (?type=, ?category=) hoặc từ khóa thì bộ lọc đổi theo, về trang 1.
  // So với giá trị trước (thay vì bỏ qua lần chạy đầu) để StrictMode chạy effect 2 lần cũng không xóa trạng thái đã khôi phục.
  const prevParams = useRef({ typeParam, categoryParam, searchParam });
  useEffect(() => {
    const prev = prevParams.current;
    if (prev.typeParam === typeParam && prev.categoryParam === categoryParam && prev.searchParam === searchParam) return;
    prevParams.current = { typeParam, categoryParam, searchParam };
    if (prev.typeParam !== typeParam || prev.categoryParam !== categoryParam) {
      setFilterState((f) => ({ ...f, type: typeParam, categories: categoryParam ? [categoryParam] : [], specs: {} }));
    }
    setPage(1);
  }, [typeParam, categoryParam, searchParam]);

  useEffect(() => {
    try {
      sessionStorage.setItem(viewKey(location.key), JSON.stringify({ filter, sort, page }));
    } catch {
      /* chế độ ẩn danh / hết dung lượng: bỏ qua, chỉ mất tính năng nhớ trang */
    }
  }, [location.key, filter, sort, page]);

  // Tải toàn bộ sản phẩm (theo từ khóa tìm kiếm) một lần; lọc/sắp xếp/phân trang làm ngay trên trình duyệt
  useEffect(() => {
    const ticket = ++latest.current; // bỏ qua kết quả cũ nếu người dùng đã đổi tìm kiếm tiếp
    const fetchData = async () => {
      setRefreshing(true);
      setLoadError(false);
      try {
        const [allCategories, productList] = await Promise.all([
          categoryService.getAllCategories(),
          productService.getProducts({ search: searchParam || undefined }),
        ]);
        if (ticket !== latest.current) return;
        setCategories(allCategories);
        setProducts(productList);
        lastLoad = { search: searchParam, products: productList, categories: allCategories };
        setSyncedAt(new Date());
      } catch (error) {
        if (ticket === latest.current) setLoadError(true);
      } finally {
        if (ticket === latest.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    fetchData();
  }, [searchParam, retry]);

  // Danh mục con thuộc danh mục cha nào (chọn cha thì gồm cả con)
  const categoryIds = useMemo(() => {
    if (!filter.categories.length) return null;
    const ids = new Set(filter.categories);
    categories.forEach((c) => c.parent_id && ids.has(c.parent_id) && ids.add(c.id));
    return ids;
  }, [filter.categories, categories]);

  const byType = useMemo(() => products.filter((p) => !filter.type || p.category_type === filter.type), [products, filter.type]);

  const loadSpecFields = useCallback(async () => {
    try { setTemplates(await customerService.specFields()); setSpecError(false); }
    catch { setSpecError(true); }
  }, []);
  useEffect(() => { void loadSpecFields(); }, [loadSpecFields]);
  const specFacets = useMemo(() => buildSpecFacets(byType, templates, filter.categories.length === 1 ? filter.categories[0] : null), [byType, templates, filter.categories]);

  const filtered = useMemo(() => {
    const list = byType.filter((p) => {
      if (categoryIds && !categoryIds.has(p.category_id)) return false;
      if (filter.brands.length) {
        const b = getBrand(p);
        if (!b || !filter.brands.includes(b)) return false;
      }
      const price = priceOf(p);
      if (filter.minPrice !== null && price < filter.minPrice) return false;
      if (filter.maxPrice !== null && price > filter.maxPrice) return false;
      if (filter.inStock && p.stock <= 0) return false;
      if (!matchesSpecFilters(p, filter.specs || {}, specFacets)) return false;
      return true;
    });
    const fn = SORTS[sort].fn;
    // "Phổ biến": còn hàng lên trước, giữ thứ tự mặc định của cửa hàng
    return fn ? [...list].sort(fn) : [...list].sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0));
  }, [byType, categoryIds, filter, sort, specFacets]);

  const typeCounts = useMemo(() => {
    const out: Record<string, number> = {};
    products.forEach((p) => p.category_type && (out[p.category_type] = (out[p.category_type] || 0) + 1));
    return out;
  }, [products]);
  const categoryCounts = useMemo(() => {
    const out: Record<number, number> = {};
    byType.forEach((p) => (out[p.category_id] = (out[p.category_id] || 0) + 1));
    return out;
  }, [byType]);
  const brands = useMemo(() => {
    const map = new Map<string, number>();
    byType.forEach((p) => {
      const b = getBrand(p);
      if (b) map.set(b, (map.get(b) || 0) + 1);
    });
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [byType]);
  const priceBounds = useMemo(() => {
    const prices = byType.map(priceOf).filter((n) => n > 0);
    return prices.length ? { min: 0, max: Math.ceil(Math.max(...prices) / 100000) * 100000 } : { min: 0, max: 0 };
  }, [byType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Trang đã nhớ vượt quá số trang (sản phẩm bị ẩn/xóa sau lần cập nhật) thì lùi về trang cuối
  useEffect(() => {
    if (!loading && page > totalPages) setPage(totalPages);
  }, [loading, page, totalPages]);
  const current = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const goPage = (p: number) => {
    setPage(Math.min(Math.max(1, p), totalPages));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="container px-4 py-8" role="status" aria-label="Đang tải sản phẩm"><div className="mb-6 h-20 animate-pulse rounded-xl bg-slate-100" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i} className="h-96 animate-pulse rounded-xl bg-slate-100" />)}</div></div>;

  const title = searchParam ? `Kết quả cho "${searchParam}"` : filter.type ? TYPE_TITLE[filter.type] || 'Sản phẩm' : 'Linh Kiện Máy Tính & PC';
  const filterPanel = (
    <ProductFilter
      categories={categories}
      filter={filter}
      onChange={setFilter}
      typeCounts={typeCounts}
      categoryCounts={categoryCounts}
      brands={brands}
      priceBounds={priceBounds}
      specFacets={specFacets}
      specError={specError}
      onRetrySpecs={() => void loadSpecFields()}
    />
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Tiêu đề trang */}
      <div className="frost-card mb-6 flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
            <span className="frost-chip border-blue-200 bg-blue-50 text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> Tìm thấy {filtered.length} sản phẩm
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Phần cứng chính hãng phân phối bởi AMD, Intel, ASUS, MSI, Corsair… Bảo hành chính hãng, đổi mới trong thời gian quy định.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5" role="group" aria-label="Kiểu hiển thị">
            {(
              [
                ['grid', 'Lưới', Squares2X2Icon],
                ['list', 'Chi tiết', ListBulletIcon],
              ] as const
            ).map(([v, label, Icon]) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition ${
                  view === v ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
          <label className="relative">
            <span className="sr-only">Sắp xếp</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="frost-input !w-auto cursor-pointer !py-2 pr-8 text-xs">
              {Object.entries(SORTS).map(([k, s]) => (
                <option key={k} value={k}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => setFiltersOpen(true)} className="frost-btn-ghost !py-2 lg:hidden">
            <FunnelIcon className="h-4 w-4" /> Bộ lọc
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="hidden lg:block lg:w-72 lg:shrink-0">{filterPanel}</aside>

        <div className="min-w-0 flex-1">
          <ActiveFilters filter={filter} categories={categories} specFacets={specFacets} onChange={setFilter} />
          {loadError && <div role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">Không tải được sản phẩm.{products.length > 0 ? ' Đang hiển thị dữ liệu lần trước.' : ''} <button type="button" onClick={() => setRetry((v) => v + 1)} className="underline">Thử lại</button></div>}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] text-slate-500">
            <span className="flex items-center gap-2">
              <CheckBadgeIcon className="h-4 w-4 text-blue-600" />
              Hiển thị {filtered.length ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)}` : 0} / {filtered.length} sản phẩm
            </span>
            {syncedAt && <span>Đã đồng bộ giá & tồn kho lúc {syncedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>

          {loadError && !products.length ? null : filtered.length === 0 ? (
            <div className="frost-card py-16 text-center">
              <p className="text-slate-500">Không tìm thấy sản phẩm phù hợp với bộ lọc.</p>
              <button type="button" onClick={() => setFilter(EMPTY_FILTER)} className="frost-btn-ghost mt-4">
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div
              className={`transition-opacity duration-200 ${refreshing ? 'opacity-60' : ''} ${
                view === 'grid' ? 'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4' : 'flex flex-col gap-3'
              }`}
              aria-busy={refreshing}
            >
              {current.map((product) => (
                <ProductCard key={product.id} product={product} view={view} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="frost-card mt-6 flex items-center justify-between gap-3 px-4 py-3" aria-label="Phân trang">
              <p className="text-sm text-slate-500">
                Trang <strong className="text-slate-900">{page}</strong> / {totalPages}
              </p>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => goPage(page - 1)} disabled={page === 1} aria-label="Trang trước" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, i, arr) => (
                    <React.Fragment key={p}>
                      {i > 0 && p - arr[i - 1] > 1 && <span className="px-1 text-slate-400">…</span>}
                      <button
                        type="button"
                        onClick={() => goPage(p)}
                        aria-current={p === page ? 'page' : undefined}
                        className={`h-9 min-w-[2.25rem] rounded-lg border px-2 text-xs transition ${
                          p === page ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
                <button type="button" onClick={() => goPage(page + 1)} disabled={page === totalPages} aria-label="Trang sau" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </nav>
          )}

          {/* Cam kết */}
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              { icon: ShieldCheckIcon, title: '100% Chính hãng', text: 'Phân phối chính thức từ AMD, Intel, ASUS, Corsair… với đầy đủ CO/CQ.' },
              { icon: BoltIcon, title: 'Giao hàng nhanh', text: 'Giao toàn quốc, miễn phí vận chuyển cho đơn hàng từ 5 triệu.' },
              { icon: WrenchScrewdriverIcon, title: 'Bảo hành tận tâm', text: 'Hỗ trợ cài đặt, vệ sinh và nâng cấp linh kiện trong suốt thời gian bảo hành.' },
            ].map(({ icon: Icon, title: t, text }) => (
              <div key={t} className="frost-card flex gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{t}</p>
                  <p className="text-sm text-slate-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Điện thoại: bộ lọc dạng ngăn kéo */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Bộ lọc sản phẩm">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div ref={filterDialog} tabIndex={-1} className="absolute inset-y-0 right-0 flex w-[min(22rem,92vw)] flex-col bg-app shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <p className="font-semibold text-slate-900">Bộ lọc · {filtered.length} sản phẩm</p>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Đóng bộ lọc" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{filterPanel}</div><div className="border-t border-slate-200 bg-white p-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}><button type="button" onClick={() => setFiltersOpen(false)} className="frost-btn w-full">Xem {filtered.length} sản phẩm</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
