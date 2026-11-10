import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCartIcon, CheckIcon, CubeIcon } from '@heroicons/react/24/outline';
import { Product } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { useCart } from '../../hooks/useCart';
import FadeImage from '../Common/FadeImage';
import { getBrand, getDiscount, isNew, keySpecs, priceOf, stockState, STOCK_LABEL } from '../../utils/productMeta';
import { WishlistButton, StockAlertButton } from './CustomerProductActions';
import { has3d } from '../Product3D/model3d';

interface ProductCardProps {
  product: Product;
  /** "grid": thẻ dọc (mặc định). "list": hàng ngang nhiều thông số hơn. */
  view?: 'grid' | 'list';
}

const STOCK_STYLE = {
  in: 'border-green-200 bg-green-50 text-green-700',
  low: 'border-amber-200 bg-amber-50 text-amber-700',
  out: 'border-slate-200 bg-slate-100 text-slate-500',
};

/** Thẻ sản phẩm: cả thẻ là một liên kết (mở tab mới được), nút giỏ hàng có trạng thái đang thêm / đã thêm. */
const ProductCard: React.FC<ProductCardProps> = ({ product, view = 'grid' }) => {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const state = stockState(product.stock);
  const outOfStock = state === 'out';
  const discount = getDiscount(product);
  const brand = getBrand(product);
  const specs = keySpecs(product, view === 'list' ? 4 : 2);
  const badge = discount ? (discount.percent >= 15 ? `Giảm ${discount.percent}%` : 'Hot deal') : isNew(product) ? 'Mới' : null;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // không mở trang chi tiết khi bấm nút
    e.stopPropagation();
    if (adding || outOfStock) return;
    setAdding(true);
    const success = await addToCart(product.id);
    setAdding(false);
    if (!success) return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  const action = outOfStock ? (
    <div className="relative z-10"><StockAlertButton id={product.id} /></div>
  ) : (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={adding}
      aria-label={`Thêm ${product.name} vào giỏ hàng`}
      className={`frost-btn relative z-10 w-full !py-2 ${added ? '!bg-green-600' : ''}`}
    >
      {adding ? (
        <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : added ? (
        <CheckIcon className="h-4 w-4" />
      ) : (
        <ShoppingCartIcon className="h-4 w-4" />
      )}
      {added ? 'Đã thêm' : 'Thêm giỏ hàng'}
    </button>
  );

  const image = (
    <div className={`relative overflow-hidden rounded-lg bg-slate-50 ${view === 'list' ? 'h-40 w-40 shrink-0 sm:h-44 sm:w-52' : 'aspect-[4/3]'}`}>
      {product.image_url ? (
        <FadeImage
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className={`h-full w-full object-contain p-3 ${outOfStock ? 'opacity-60 grayscale' : ''}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">Chưa có ảnh</div>
      )}
      <div className="absolute right-2 top-2 z-10"><WishlistButton id={product.id} /></div>
      {has3d(product) && (
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
          <CubeIcon className="h-3 w-3" /> 3D · AR
        </span>
      )}
    </div>
  );

  const header = (
    <div className="mb-2 flex items-center justify-between gap-2">
      {badge ? <span className="frost-chip border-blue-200 bg-blue-50 text-blue-700">{badge}</span> : <span />}
      <span className={`frost-chip ${STOCK_STYLE[state]}`}>{STOCK_LABEL[state]}</span>
    </div>
  );

  const meta = (
    <div className="mb-1 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider">
      <span className="truncate text-slate-500">{product.category_name || 'Sản phẩm'}</span>
      {brand && <span className="shrink-0 font-semibold text-blue-600">{brand}</span>}
    </div>
  );

  const specTable = (
    <dl className="mt-2 min-h-[3.5rem] space-y-1 rounded-lg bg-slate-50 px-2.5 py-2 text-[11px]">
      {specs.map(([k, v]) => (
        <div key={k} className="flex gap-2">
          <dt className="w-20 shrink-0 truncate capitalize text-slate-500">{k}:</dt>
          <dd className="min-w-0 truncate text-slate-800">{v}</dd>
        </div>
      ))}
    </dl>
  );

  const price = (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-blue-600 sm:text-xl">{formatPrice(priceOf(product))}</span>
        {discount && <span className="rounded border border-red-200 bg-red-50 px-1 text-[10px] font-bold text-red-600">-{discount.percent}%</span>}
      </div>
      <p className="text-[11px] text-slate-400">
        {discount ? <span className="line-through">{formatPrice(discount.original)}</span> : outOfStock ? 'Giá niêm yết' : 'Giá cam kết tốt'}
      </p>
    </div>
  );

  if (view === 'list') {
    return (
      <article
        className="group relative frost-card flex gap-4 p-3 transition duration-200 hover:border-blue-300 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 sm:p-4"
      >
        {image}
        <div className="flex min-w-0 flex-1 flex-col">
          {header}
          {meta}
          <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-semibold text-slate-900 sm:text-base"><Link to={`/products/${product.id}`} className="after:absolute after:inset-0 after:rounded-xl">{product.name}</Link></h3>
          {product.description && <p className="mt-1 hidden text-sm text-slate-500 sm:line-clamp-2">{product.description}</p>}
          <div>{specTable}</div>
          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
            {price}
            <div className="w-full sm:w-44">{action}</div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className="group relative frost-card flex h-full flex-col p-3 transition duration-200 hover:border-blue-300 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
    >
      {header}
      {image}
      <div className="flex flex-1 flex-col pt-3">
        {meta}
        <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-semibold text-slate-900 sm:text-[15px]"><Link to={`/products/${product.id}`} className="after:absolute after:inset-0 after:rounded-xl">{product.name}</Link></h3>
        <div>{specTable}</div>
        <div className="mt-auto space-y-3 pt-3">
          {price}
          {action}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
