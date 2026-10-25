import React from 'react';
import { FunnelIcon, XMarkIcon, AdjustmentsHorizontalIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Category } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { EMPTY_FILTER, FilterState } from './filterState';


const TYPES = [
  { value: null, label: 'Tất cả sản phẩm' },
  { value: 'component', label: 'Linh kiện PC' },
  { value: 'pc', label: 'Máy tính nguyên bộ' },
  { value: 'peripheral', label: 'Phụ kiện & Gaming gear' },
] as const;

interface ProductFilterProps {
  categories: Category[];
  filter: FilterState;
  onChange: (next: FilterState) => void;
  typeCounts: Record<string, number>;
  categoryCounts: Record<number, number>;
  brands: { name: string; count: number }[];
  priceBounds: { min: number; max: number };
}

const Section: React.FC<{ title: string; action?: React.ReactNode; children: React.ReactNode }> = ({ title, action, children }) => (
  <section className="frost-card p-4">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="frost-label !text-slate-800">{title}</h3>
      {action}
    </div>
    {children}
  </section>
);

const ProductFilter: React.FC<ProductFilterProps> = ({ categories, filter, onChange, typeCounts, categoryCounts, brands, priceBounds }) => {
  const set = (patch: Partial<FilterState>) => onChange({ ...filter, ...patch });
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const visibleCategories = categories.filter((c) => !filter.type || c.type === filter.type);
  const catName = (id: number) => categories.find((c) => c.id === id)?.name || `#${id}`;

  const chips: { label: string; clear: () => void }[] = [
    ...(filter.type ? [{ label: TYPES.find((t) => t.value === filter.type)?.label || filter.type, clear: () => set({ type: null, categories: [] }) }] : []),
    ...filter.categories.map((id) => ({ label: catName(id), clear: () => set({ categories: filter.categories.filter((x) => x !== id) }) })),
    ...filter.brands.map((b) => ({ label: `Hãng: ${b}`, clear: () => set({ brands: filter.brands.filter((x) => x !== b) }) })),
    ...(filter.minPrice !== null || filter.maxPrice !== null ? [{ label: 'Khoảng giá', clear: () => set({ minPrice: null, maxPrice: null }) }] : []),
    ...(filter.inStock ? [{ label: 'Còn hàng', clear: () => set({ inStock: false }) }] : []),
  ];

  const maxValue = filter.maxPrice ?? priceBounds.max;
  const step = Math.max(10000, Math.round(priceBounds.max / 200 / 10000) * 10000);

  return (
    <div className="space-y-4">
      {/* Bộ lọc đang chọn */}
      <section className="frost-card p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <FunnelIcon className="h-5 w-5 text-blue-600" /> Bộ lọc tuyển chọn
          </h2>
          {chips.length > 0 && (
            <button type="button" onClick={() => onChange(EMPTY_FILTER)} className="text-[11px] text-blue-600 hover:underline">
              Đặt lại ({chips.length})
            </button>
          )}
        </div>
        {chips.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={c.clear}
                className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] text-blue-700 hover:bg-blue-100"
              >
                {c.label} <XMarkIcon className="h-3 w-3" />
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-xs text-slate-500">Chọn nhóm, danh mục, hãng hoặc khoảng giá để lọc nhanh.</p>
        )}
      </section>

      <Section title="Nhóm sản phẩm" action={<AdjustmentsHorizontalIcon className="h-4 w-4 text-blue-600" />}>
        <ul className="space-y-1">
          {TYPES.map((t) => {
            const active = filter.type === t.value;
            const count = t.value ? typeCounts[t.value] || 0 : Object.values(typeCounts).reduce((a, b) => a + b, 0);
            return (
              <li key={t.label}>
                <button
                  type="button"
                  onClick={() => set({ type: t.value, categories: [] })}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                    active ? 'border-blue-200 bg-blue-50 font-semibold text-blue-700' : 'border-transparent text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
                    {t.label}
                  </span>
                  <span className={`rounded px-1.5 text-[10px] ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      {visibleCategories.length > 0 && (
        <Section title="Danh mục phần cứng">
          <ul className="space-y-0.5">
            {visibleCategories.map((c) => {
              const checked = filter.categories.includes(c.id);
              return (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                    <span className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => set({ categories: toggle(filter.categories, c.id) })}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={checked ? 'font-semibold text-slate-900' : ''}>
                        {c.parent_id ? '— ' : ''}
                        {c.name}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400">{categoryCounts[c.id] || 0}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {brands.length > 0 && (
        <Section title="Thương hiệu" action={filter.brands.length ? <span className="text-[10px] text-blue-600">Đã chọn {filter.brands.length}</span> : undefined}>
          <div className="flex flex-wrap gap-1.5">
            {brands.map((b) => {
              const active = filter.brands.includes(b.name);
              return (
                <button
                  key={b.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set({ brands: toggle(filter.brands, b.name) })}
                  className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] transition ${
                    active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                  }`}
                >
                  {active && <CheckIcon className="h-3 w-3" />}
                  {b.name}
                  <span className={active ? 'text-white/70' : 'text-slate-400'}>{b.count}</span>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {priceBounds.max > 0 && (
        <Section title="Khoảng giá (VND)">
          <input
            type="range"
            min={priceBounds.min}
            max={priceBounds.max}
            step={step}
            value={Math.min(maxValue, priceBounds.max)}
            onChange={(e) => set({ maxPrice: Number(e.target.value) >= priceBounds.max ? null : Number(e.target.value) })}
            aria-label="Giá tối đa"
            className="frost-range w-full"
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-center">
              <span className="block text-[10px] text-slate-500">Tối thiểu</span>
              <input
                type="number"
                min={0}
                step={100000}
                inputMode="numeric"
                placeholder={String(priceBounds.min)}
                value={filter.minPrice ?? ''}
                onChange={(e) => set({ minPrice: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })}
                className="w-full bg-transparent text-center text-xs text-slate-800 outline-none"
              />
            </label>
            <label className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-center">
              <span className="block text-[10px] text-blue-700">Tối đa</span>
              <input
                type="number"
                min={0}
                step={100000}
                inputMode="numeric"
                placeholder={String(priceBounds.max)}
                value={filter.maxPrice ?? ''}
                onChange={(e) => set({ maxPrice: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })}
                className="w-full bg-transparent text-center text-xs font-semibold text-blue-700 outline-none"
              />
            </label>
          </div>
          <p className="mt-2 text-center text-[10px] text-slate-400">
            {formatPrice(filter.minPrice ?? priceBounds.min)} – {formatPrice(maxValue)}
          </p>
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={filter.inStock}
              onChange={(e) => set({ inStock: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Chỉ hiện sản phẩm còn hàng
          </label>
        </Section>
      )}

    </div>
  );
};

export default ProductFilter;
