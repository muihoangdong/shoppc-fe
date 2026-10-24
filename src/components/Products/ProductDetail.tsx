import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { useCart } from '../../hooks/useCart';
import {
  ShoppingCartIcon,
  HeartIcon,
  CheckIcon,
  MagnifyingGlassPlusIcon,
  CubeIcon,
  DevicePhoneMobileIcon,
  BellAlertIcon,
  ShieldCheckIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ImageLightbox from './ImageLightbox';
import FadeImage from '../Common/FadeImage';
import { getBrand, getDiscount, restockWatch, stockState, STOCK_LABEL } from '../../utils/productMeta';
import { has3d, preloadModelViewer } from '../Product3D/model3d';

// Trình xem 3D (three.js + model-viewer) chỉ tải khi khách bấm xem
const Product3DViewer = lazy(() => import('../Product3D/Product3DViewer'));

interface ProductDetailProps {
  product: Product;
}

type Slide = 'photo' | '3d';

const STOCK_STYLE = {
  in: 'border-green-200 bg-green-50 text-green-700',
  low: 'border-amber-200 bg-amber-50 text-amber-700',
  out: 'border-slate-200 bg-slate-100 text-slate-500',
};

const ProductDetail: React.FC<ProductDetailProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [quantity, setQuantity] = useState(1);
  const [isWishlist, setIsWishlist] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const closeZoom = useCallback(() => setZoomOpen(false), []);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [watching, setWatching] = useState(() => restockWatch.has(product.id));
  const [slide, setSlide] = useState<Slide>('photo');
  // Mở thẳng trình xem 3D khi vào từ mã QR (?view=3d) — tiện cho khách quét mã từ máy tính sang điện thoại
  const [viewerOpen, setViewerOpen] = useState(() => searchParams.get('view') === '3d');
  const preferAr = searchParams.get('ar') === '1';

  const can3d = has3d(product);
  const brand = getBrand(product);
  const discount = getDiscount(product);
  const state = stockState(product.stock);

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
    if (searchParams.get('view')) {
      const next = new URLSearchParams(searchParams);
      next.delete('view');
      next.delete('ar');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!can3d && viewerOpen) setViewerOpen(false);
  }, [can3d, viewerOpen]);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  // Chống bấm nhiều lần: trong lúc đang thêm thì khóa nút; xong thì nút báo "Đã thêm" 1,5 giây
  const handleAddToCart = async () => {
    if (adding || product.stock <= 0) return;
    setAdding(true);
    await addToCart(product.id, quantity);
    setAdding(false);
    setAdded(true);
    setQuantity(1);
    window.setTimeout(() => setAdded(false), 1500);
  };

  const toggleWatch = () => {
    const on = restockWatch.toggle(product.id);
    setWatching(on);
    toast.success(on ? 'Sẽ báo cho bạn khi sản phẩm có hàng trở lại' : 'Đã tắt báo khi có hàng');
  };

  const specsList = product.specs ? Object.entries(product.specs) : [];

  return (
    <div className="frost-card overflow-hidden">
      <div className="grid grid-cols-1 gap-8 p-4 sm:p-6 md:grid-cols-2">
        {/* Thư viện: ảnh + 3D */}
        <div>
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white">
            <div className="frost-grid-bg pointer-events-none absolute inset-0 opacity-50" />
            <div className="relative flex h-80 items-center justify-center sm:h-[26rem]">
              {slide === '3d' && can3d ? (
                <button
                  type="button"
                  onClick={() => setViewerOpen(true)}
                  onMouseEnter={preloadModelViewer}
                  className="group flex h-full w-full flex-col items-center justify-center gap-4 p-6"
                  aria-label="Mở trình xem 3D"
                >
                  <span className="relative flex h-32 w-32 items-center justify-center">
                    <span className="absolute inset-0 animate-[spin_9s_linear_infinite] rounded-full border-2 border-dashed border-blue-300" />
                    <CubeIcon className="h-16 w-16 text-blue-600 transition group-hover:scale-110" />
                  </span>
                  <span className="text-center">
                    <span className="block font-semibold text-slate-900">Xem sản phẩm dạng 3D</span>
                    <span className="block text-sm text-slate-500">Xoay 360°, phóng to và đặt vào không gian thật bằng AR</span>
                  </span>
                  <span className="frost-btn rounded-full">Mở trình xem 3D</span>
                </button>
              ) : product.image_url ? (
                <button
                  type="button"
                  onClick={() => setZoomOpen(true)}
                  aria-label="Phóng to ảnh sản phẩm"
                  className="group relative flex h-full w-full cursor-zoom-in items-center justify-center p-6"
                >
                  <FadeImage src={product.image_url} alt={product.name} className="max-h-full max-w-full object-contain group-hover:scale-105" />
                  <span className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-slate-900/70 px-3 py-1 text-xs text-white opacity-90 transition group-hover:opacity-100">
                    <MagnifyingGlassPlusIcon className="h-4 w-4" /> Bấm để phóng to
                  </span>
                </button>
              ) : (
                <div className="text-center text-slate-400">
                  <svg className="mx-auto h-32 w-32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2">Hình ảnh sản phẩm</p>
                </div>
              )}

              <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                <span className={`frost-chip ${STOCK_STYLE[state]}`}>
                  {STOCK_LABEL[state]}
                  {product.stock > 0 ? ` · ${product.stock}` : ''}
                </span>
                {discount && <span className="frost-chip border-red-200 bg-red-50 text-red-600">-{discount.percent}%</span>}
              </div>

              {can3d && slide === 'photo' && (
                <button
                  type="button"
                  onClick={() => setViewerOpen(true)}
                  onMouseEnter={preloadModelViewer}
                  className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:border-blue-300 hover:text-blue-700"
                >
                  <CubeIcon className="h-4 w-4 text-blue-600" /> Xem 3D
                </button>
              )}
            </div>
          </div>

          {/* Ảnh thu nhỏ: ảnh chụp + ô 3D (như IKEA) */}
          <div className="mt-3 flex gap-2">
            <Thumb active={slide === 'photo'} onClick={() => setSlide('photo')} label="Ảnh sản phẩm">
              {product.image_url ? <img src={product.image_url} alt="" className="h-full w-full object-contain p-1" /> : <span className="text-[10px] text-slate-400">Ảnh</span>}
            </Thumb>
            {can3d && (
              <Thumb active={slide === '3d'} onClick={() => setSlide('3d')} label="Xem 3D">
                <span className="flex flex-col items-center leading-none text-blue-600">
                  <CubeIcon className="h-6 w-6" />
                  <span className="mt-1 font-mono text-[10px] font-bold">3D</span>
                </span>
              </Thumb>
            )}
          </div>

          {can3d && (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => setViewerOpen(true)} className="frost-btn-ghost">
                <CubeIcon className="h-4 w-4" /> Xoay 360° mô hình 3D
              </button>
              <button type="button" onClick={() => setViewerOpen(true)} className="frost-btn-ghost">
                <DevicePhoneMobileIcon className="h-4 w-4" /> Xem trong không gian (AR)
              </button>
            </div>
          )}
        </div>

        {/* Thông tin sản phẩm */}
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="frost-chip border-blue-200 bg-blue-50 text-blue-700">{product.category_name || 'Sản phẩm'}</span>
            {brand && <span className="frost-chip border-slate-200 bg-slate-50 text-slate-600">Hãng: {brand}</span>}
            <span className="font-mono text-[11px] text-slate-400">SKU #{String(product.id).padStart(5, '0')}</span>
          </div>
          <h1 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">{product.name}</h1>

          <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-3xl font-bold text-blue-600">{formatPrice(Number(product.price))}</span>
            {discount && (
              <>
                <span className="pb-1 text-base text-slate-400 line-through">{formatPrice(discount.original)}</span>
                <span className="mb-1 rounded-md bg-red-100 px-2 py-0.5 font-mono text-xs font-bold text-red-600">Tiết kiệm {formatPrice(discount.original - Number(product.price))}</span>
              </>
            )}
          </div>

          {product.description && (
            <div className="mb-6">
              <h3 className="frost-label mb-2">Mô tả sản phẩm</h3>
              <p className="leading-relaxed text-slate-600">{product.description}</p>
            </div>
          )}

          {specsList.length > 0 && (
            <div className="mb-6">
              <h3 className="frost-label mb-2">Thông số kỹ thuật</h3>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <tbody>
                    {specsList.map(([key, value], i) => (
                      <tr key={key} className={i % 2 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="w-2/5 px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-slate-500">{key.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-800">{String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {product.stock > 0 && (
            <div className="mb-6">
              <h3 className="frost-label mb-2">Số lượng</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center rounded-lg border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    aria-label="Giảm số lượng"
                    className="px-4 py-2 transition hover:bg-slate-100 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="min-w-[3.5rem] border-x border-slate-200 px-4 py-2 text-center tabular-nums" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock}
                    aria-label="Tăng số lượng"
                    className="px-4 py-2 transition hover:bg-slate-100 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-slate-500">Còn {product.stock} sản phẩm</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {product.stock > 0 ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                disabled={adding}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-colors duration-200 ${
                  added ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-80'
                }`}
              >
                {adding ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : added ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <ShoppingCartIcon className="h-5 w-5" />
                )}
                {adding ? 'Đang thêm…' : added ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ hàng'}
              </motion.button>
            ) : (
              <button
                type="button"
                onClick={toggleWatch}
                aria-pressed={watching}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-6 py-3 font-semibold transition ${
                  watching ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                <BellAlertIcon className="h-5 w-5" />
                {watching ? 'Đang chờ hàng về · bấm để tắt' : 'Báo khi có hàng'}
              </button>
            )}

            <motion.button
              whileTap={{ scale: 0.95 }}
              aria-label={isWishlist ? 'Bỏ yêu thích' : 'Yêu thích'}
              aria-pressed={isWishlist}
              onClick={() => {
                setIsWishlist(!isWishlist);
                toast.success(isWishlist ? 'Đã xóa khỏi yêu thích' : 'Đã thêm vào yêu thích');
              }}
              className="group rounded-lg border border-slate-300 px-5 py-3 transition hover:border-red-400"
            >
              {isWishlist ? <HeartSolidIcon className="h-5 w-5 text-red-500" /> : <HeartIcon className="h-5 w-5 text-slate-500 group-hover:text-red-500" />}
            </motion.button>
          </div>

          <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              { icon: ShieldCheckIcon, title: 'Chính hãng 100%', text: 'Đủ CO/CQ' },
              { icon: TruckIcon, title: 'Giao nhanh', text: 'Miễn phí từ 5 triệu' },
              { icon: WrenchScrewdriverIcon, title: 'Bảo hành 12 tháng', text: 'Tại mọi chi nhánh' },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <Icon className="h-5 w-5 shrink-0 text-blue-600" />
                <span className="min-w-0 leading-tight">
                  <span className="block text-xs font-semibold text-slate-800">{title}</span>
                  <span className="block text-[11px] text-slate-500">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {zoomOpen && product.image_url && <ImageLightbox src={product.image_url} alt={product.name} onClose={closeZoom} />}
      {viewerOpen && can3d && (
        <Suspense fallback={null}>
          <Product3DViewer product={product} onClose={closeViewer} preferAr={preferAr} />
        </Suspense>
      )}
    </div>
  );
};

const Thumb: React.FC<{ active: boolean; onClick: () => void; label: string; children: React.ReactNode }> = ({ active, onClick, label, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    aria-pressed={active}
    className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border-2 bg-white transition ${
      active ? 'border-blue-600' : 'border-slate-200 hover:border-blue-300'
    }`}
  >
    {children}
  </button>
);

export default ProductDetail;
