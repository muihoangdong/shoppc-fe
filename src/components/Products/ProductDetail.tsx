import { createPortal } from 'react-dom';
import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { useCart } from '../../hooks/useCart';
import {
  ShoppingCartIcon,
  CheckIcon,
  CubeIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { WishlistButton, StockAlertButton } from './CustomerProductActions';
import ProductGallery from './ProductGallery';
import { getBrand, getDiscount, stockState, STOCK_LABEL } from '../../utils/productMeta';
import { has3d, preloadModelViewer } from '../Product3D/model3d';

// Trình xem 3D (three.js + model-viewer) chỉ tải khi khách bấm xem
const Product3DViewer = lazy(() => import('../Product3D/Product3DViewer'));

interface ProductDetailProps {
  product: Product;
}

const STOCK_STYLE = {
  in: 'border-green-200 bg-green-50 text-green-700',
  low: 'border-amber-200 bg-amber-50 text-amber-700',
  out: 'border-slate-200 bg-slate-100 text-slate-500',
};

const ProductDetail: React.FC<ProductDetailProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
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
    const success = await addToCart(product.id, quantity);
    setAdding(false);
    if (!success) return;
    setAdded(true);
    setQuantity(1);
    window.setTimeout(() => setAdded(false), 1500);
  };

  const specsList = product.specs ? Object.entries(product.specs) : [];

  return (
    <div className="frost-card overflow-hidden">
      <div className="grid grid-cols-1 gap-8 p-4 sm:p-6 md:grid-cols-2">
        {/* Thư viện ảnh có ảnh thu nhỏ và nút xem 3D */}
        <div className="min-w-0">
          <ProductGallery
            key={product.id}
            images={[
              ...new Set([product.image_url, ...(product.image_urls || [])].filter((url): url is string => !!url)),
            ]}
            name={product.name}
            onOpen3d={
              can3d
                ? () => {
                    preloadModelViewer();
                    setViewerOpen(true);
                  }
                : undefined
            }
            badge={
              <>
                <span className={`frost-chip ${STOCK_STYLE[state]}`}>
                  {STOCK_LABEL[state]}
                  {product.stock > 0 ? ` · ${product.stock}` : ''}
                </span>
                {discount && (
                  <span className="frost-chip border-red-200 bg-red-50 text-red-600">-{discount.percent}%</span>
                )}
              </>
            }
          />

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
            <span className="frost-chip border-blue-200 bg-blue-50 text-blue-700">
              {product.category_name || 'Sản phẩm'}
            </span>
            {brand && <span className="frost-chip border-slate-200 bg-slate-50 text-slate-600">Hãng: {brand}</span>}
            <span className="text-[11px] text-slate-400">SKU #{String(product.id).padStart(5, '0')}</span>
          </div>
          <h1 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">{product.name}</h1>

          <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-3xl font-bold text-blue-600">{formatPrice(Number(product.price))}</span>
            {discount && (
              <>
                <span className="pb-1 text-base text-slate-400 line-through">{formatPrice(discount.original)}</span>
                <span className="mb-1 rounded-md bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                  Tiết kiệm {formatPrice(discount.original - Number(product.price))}
                </span>
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
                        <td className="w-2/5 px-4 py-2.5 text-xs uppercase tracking-wide text-slate-500">
                          {key.replace(/_/g, ' ')}
                        </td>
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
                  <span
                    className="min-w-[3.5rem] border-x border-slate-200 px-4 py-2 text-center tabular-nums"
                    aria-live="polite"
                  >
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

          <div className="hidden gap-3 sm:flex">
            {product.stock > 0 ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                disabled={adding}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-colors duration-200 ${
                  added
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-80'
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
              <StockAlertButton id={product.id} />
            )}
            <WishlistButton id={product.id} />
          </div>

          <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              { icon: ShieldCheckIcon, title: 'Chính hãng 100%', text: 'Đủ CO/CQ' },
              { icon: TruckIcon, title: 'Giao nhanh', text: 'Miễn phí từ 5 triệu' },
              {
                icon: WrenchScrewdriverIcon,
                title: `Bảo hành ${product.warranty_months ?? 12} tháng`,
                text: 'Tại mọi chi nhánh',
              },
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
      {!viewerOpen && (
        <>
          <div className="h-24 sm:hidden" aria-hidden="true" />
          {createPortal(
            <div
              className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:hidden"
              style={{ paddingBottom: 'max(.75rem, env(safe-area-inset-bottom))' }}
            >
              <div className="min-w-0">
                <p className="text-xs text-slate-500">{product.stock > 0 ? `Số lượng: ${quantity}` : 'Tạm hết hàng'}</p>
                <p className="text-lg font-semibold text-blue-600">{formatPrice(Number(product.price))}</p>
              </div>
              {product.stock > 0 ? (
                <button
                  type="button"
                  disabled={adding}
                  onClick={() => void handleAddToCart()}
                  className="frost-btn min-w-36"
                >
                  {adding ? 'Đang thêm…' : added ? 'Đã thêm vào giỏ' : 'Thêm giỏ hàng'}
                </button>
              ) : (
                <StockAlertButton id={product.id} />
              )}
            </div>,
            document.body,
          )}
        </>
      )}
      {viewerOpen && can3d && (
        <Suspense fallback={null}>
          <Product3DViewer product={product} onClose={closeViewer} preferAr={preferAr} />
        </Suspense>
      )}
    </div>
  );
};

export default ProductDetail;
