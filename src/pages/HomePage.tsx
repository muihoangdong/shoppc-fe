import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ComputerDesktopIcon,
  BriefcaseIcon,
  PaintBrushIcon,
  ArrowRightIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import heroPhoto from '../assets/home-pc-setup.jpg';
import { productService } from '../services/productService';
import { Product } from '../types';
import ProductCard from '../components/Products/ProductCard';
import { PRODUCT_GRID } from '../utils/layout';
import { formatPrice } from '../utils/formatters';
import { isPcPurpose, PC_PURPOSES, suggestReadyMadePcs } from '../utils/pcSuggestions';
import type { PcPurpose } from '../utils/pcSuggestions';

const purposeOptions = [
  { key: 'gaming', icon: ComputerDesktopIcon },
  { key: 'office', icon: BriefcaseIcon },
  { key: 'design', icon: PaintBrushIcon },
] as const;
const budgets = [10000000, 15000000, 20000000, 25000000, 35000000, 50000000, 0];
const defaultBudget = 25000000;

export default function HomePage() {
  const [params, setParams] = useSearchParams();
  const requestedPurpose = params.get('purpose');
  const purpose = isPcPurpose(requestedPurpose) ? requestedPurpose : 'gaming';
  const budget = budgets.find((amount) => String(amount) === params.get('budget')) ?? defaultBudget;
  const [draftPurpose, setDraftPurpose] = useState<PcPurpose>(purpose);
  const [draftBudget, setDraftBudget] = useState(budget);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const suggested = suggestReadyMadePcs(products, purpose, budget || Infinity);
  const builderParams = new URLSearchParams({ purpose });
  if (budget) builderParams.set('budget', String(budget));
  const builderUrl = `/build-pc?${builderParams.toString()}`;

  const showSuggestions = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = new URLSearchParams(params);
    next.set('purpose', draftPurpose);
    next.set('budget', String(draftBudget));
    setParams(next, { replace: true });
    resultsHeading.current?.focus({ preventScroll: true });
    resultsHeading.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  };

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
    <div className="container space-y-10 px-4 py-5 sm:space-y-14 sm:py-8">
      <section aria-labelledby="needs-title" className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="flex flex-col justify-center px-5 py-7 sm:px-9 sm:py-10 lg:px-10 xl:px-14">
          <h1 id="needs-title" className="max-w-xl text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Chọn PC theo nhu cầu
          </h1>
          <form onSubmit={showSuggestions} className="mt-6 max-w-md space-y-4 sm:mt-7">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-slate-800">Nhu cầu sử dụng</legend>
              <div className="grid grid-cols-3 gap-2">
                {purposeOptions.map(({ key, icon: Icon }) => (
                  <label key={key} className="relative cursor-pointer">
                    <input type="radio" name="pc-purpose" value={key} checked={draftPurpose === key} onChange={() => setDraftPurpose(key)} className="peer sr-only" />
                    <span className="flex min-h-12 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-1.5 text-center text-xs font-semibold text-slate-700 transition-colors hover:border-blue-400 peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 sm:gap-2 sm:px-2 sm:text-sm">
                      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                      {PC_PURPOSES[key].label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="home-pc-budget" className="mb-2 block text-sm font-semibold text-slate-800">Ngân sách tối đa</label>
              <select id="home-pc-budget" value={draftBudget} onChange={(event) => setDraftBudget(Number(event.target.value))} className="frost-input min-h-12">
                {budgets.map((amount) => <option key={amount} value={amount}>{amount ? formatPrice(amount) : 'Mọi mức giá'}</option>)}
              </select>
            </div>
            <button type="submit" className="frost-btn min-h-12 w-full !px-6 !text-sm sm:w-auto">
              Xem cấu hình <ArrowRightIcon aria-hidden="true" className="h-4 w-4" />
            </button>
          </form>
        </div>
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 lg:aspect-auto lg:min-h-[26rem]">
          <img src={heroPhoto} alt="Máy tính để bàn màu đen bên cạnh màn hình trên bàn gỗ" fetchPriority="high" width={1536} height={1024} className="absolute inset-0 h-full w-full object-cover" />
        </div>
      </section>

      <section aria-labelledby="pc-suggestions" aria-busy={loading}>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 ref={resultsHeading} id="pc-suggestions" tabIndex={-1} className="scroll-mt-32 text-2xl font-bold text-slate-950 sm:text-3xl">Cấu hình gợi ý</h2>
            <p className="mt-1 text-sm text-slate-600" aria-live="polite">
              {PC_PURPOSES[purpose].label} · {budget ? `Tối đa ${formatPrice(budget)}` : 'Mọi mức giá'}
            </p>
          </div>
          <Link to={builderUrl} className="frost-btn-ghost min-h-10">
            <AdjustmentsHorizontalIcon aria-hidden="true" className="h-4 w-4" /> Tự chọn linh kiện
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3" role="status" aria-label="Đang tải cấu hình gợi ý">
            {Array.from({ length: 3 }, (_, index) => <div key={index} aria-hidden="true" className="h-80 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none" />)}
          </div>
        ) : error ? (
          <div role="alert" className="frost-card p-6">
            <p className="text-sm text-red-600">Không tải được sản phẩm.</p>
            <button type="button" onClick={() => setRetry((value) => value + 1)} className="frost-btn-ghost mt-3">Tải lại sản phẩm</button>
          </div>
        ) : suggested.length ? (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {suggested.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="frost-card p-6 sm:p-8" role="status">
            <p className="font-semibold text-slate-900">Chưa có PC lắp sẵn phù hợp đang còn hàng.</p>
            <p className="mt-1 text-sm text-slate-600">Thử đổi ngân sách hoặc tự chọn linh kiện.</p>
            <Link to="/products?type=pc" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-800 hover:underline">
              Xem tất cả PC <ArrowRightIcon aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>
      {!error && [
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
