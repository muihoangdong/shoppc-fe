import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ComputerDesktopIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  PaintBrushIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { productService } from '../services/productService';
import { Product } from '../types';
import ProductCard from '../components/Products/ProductCard';
import { PRODUCT_GRID } from '../utils/layout';

const needs = [
  { label: 'PC gaming', search: 'gaming', icon: ComputerDesktopIcon },
  { label: 'Học tập', search: 'học', icon: AcademicCapIcon },
  { label: 'Văn phòng', search: 'văn phòng', icon: BriefcaseIcon },
  { label: 'Thiết kế', search: 'đồ họa', icon: PaintBrushIcon },
];
export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    productService
      .getProducts()
      .then((list) => {
        if (alive) setProducts(list);
      })
      .catch(() => {
        if (alive) setError(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [retry]);
  return (
    <div className="container space-y-10 px-4 py-8 sm:py-10">
      <section aria-labelledby="needs-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-xs font-semibold text-blue-600">SHOPPC · CHỌN THEO NHU CẦU</p>
            <h1 id="needs-title" className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              Tìm chiếc PC phù hợp với bạn
            </h1>
          </div>
          <Link to="/build-pc" className="text-sm font-medium text-blue-600 hover:underline">
            Cấu hình PC →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {needs.map(({ label, search, icon: Icon }) => (
            <Link
              key={label}
              to={`/products?type=pc&search=${encodeURIComponent(search)}`}
              className="flex items-center gap-3 rounded-xl bg-white p-4 transition-colors hover:bg-blue-50"
            >
              <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Icon className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-900">{label}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
      {error && (
        <div role="alert" className="rounded-xl bg-white p-6">
          <p className="text-sm text-red-600">Không tải được sản phẩm. Vui lòng thử lại.</p>
          <button type="button" onClick={() => setRetry((v) => v + 1)} className="frost-btn-ghost mt-3">
            Tải lại sản phẩm
          </button>
        </div>
      )}
      {[
        {
          title: 'Sản phẩm nổi bật',
          list: products.slice(0, 8),
          href: '/products',
        },
        {
          title: 'PC Gaming & Văn phòng',
          list: products.filter((p) => p.category_type === 'pc').slice(0, 4),
          href: '/products?type=pc',
        },
        {
          title: 'Linh kiện máy tính',
          list: products.filter((p) => p.category_type === 'component').slice(0, 4),
          href: '/products?type=component',
        },
      ].map(({ title, list, href }) => (
        <section key={title}>
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h2>
            </div>
            <Link
              to={href}
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-blue-600 hover:underline sm:text-sm"
            >
              Xem tất cả <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className={PRODUCT_GRID} aria-busy={loading}>
            {loading
              ? Array.from({ length: 4 }, (_, i) => (
                  <div key={i} aria-hidden="true" className="h-96 animate-pulse rounded-xl bg-slate-100" />
                ))
              : list.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
          {!loading && !error && !list.length && (
            <div className="rounded-xl bg-white p-6 text-sm text-slate-500">
              Chưa có sản phẩm trong nhóm này.{' '}
              <Link to="/products" className="text-blue-600 underline">
                Xem tất cả sản phẩm
              </Link>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
