import React, { useCallback, useState } from 'react';
import { Product } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { useCart } from '../../hooks/useCart';
import { ShoppingCartIcon, HeartIcon, CheckIcon, MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ImageLightbox from './ImageLightbox';
import FadeImage from '../Common/FadeImage';

interface ProductDetailProps {
  product: Product;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isWishlist, setIsWishlist] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const closeZoom = useCallback(() => setZoomOpen(false), []);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

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

  const specsList = product.specs ? Object.entries(product.specs) : [];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
        {/* Product Image */}
        <div className="relative">
          <div className="bg-gray-100 rounded-lg h-80 sm:h-96 flex items-center justify-center overflow-hidden">
            {product.image_url ? (
              <button
                type="button"
                onClick={() => setZoomOpen(true)}
                aria-label="Phóng to ảnh sản phẩm"
                className="group relative flex h-full w-full cursor-zoom-in items-center justify-center"
              >
                <FadeImage
                  src={product.image_url}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain group-hover:scale-105"
                />
                <span className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs text-white opacity-90 transition group-hover:opacity-100">
                  <MagnifyingGlassPlusIcon className="h-4 w-4" /> Bấm để phóng to
                </span>
              </button>
            ) : (
              <div className="text-gray-400 text-center">
                <svg className="w-32 h-32 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2">Hình ảnh sản phẩm</p>
              </div>
            )}
          </div>
          
          {/* Stock Status */}
          <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold ${
            product.stock > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {product.stock > 0 ? `Còn hàng (${product.stock})` : 'Hết hàng'}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          
          {/* Category Badge */}
          <div className="mb-4">
            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              {product.category_name || 'Sản phẩm'}
            </span>
          </div>

          {/* Price */}
          <div className="mb-4">
            <span className="text-3xl font-bold text-red-600">{formatPrice(product.price)}</span>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Mô tả sản phẩm</h3>
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Specifications */}
          {specsList.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Thông số kỹ thuật</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <table className="w-full">
                  <tbody>
                    {specsList.map(([key, value]) => (
                      <tr key={key} className="border-b border-gray-200 last:border-0">
                        <td className="py-2 font-medium text-gray-700 capitalize">
                          {key.replace(/_/g, ' ')}:
                        </td>
                        <td className="py-2 text-gray-600">{String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          {product.stock > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Số lượng</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border rounded-lg">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    aria-label="Giảm số lượng"
                    className="px-4 py-2 hover:bg-gray-100 transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="min-w-[3.5rem] px-4 py-2 border-x text-center tabular-nums" aria-live="polite">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock}
                    aria-label="Tăng số lượng"
                    className="px-4 py-2 hover:bg-gray-100 transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <span className="text-gray-500">Còn {product.stock} sản phẩm</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || adding}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 ${
                product.stock <= 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : added
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
              {product.stock <= 0 ? 'Hết hàng' : adding ? 'Đang thêm…' : added ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ hàng'}
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              aria-label={isWishlist ? 'Bỏ yêu thích' : 'Yêu thích'}
              aria-pressed={isWishlist}
              onClick={() => {
                setIsWishlist(!isWishlist);
                toast.success(isWishlist ? 'Đã xóa khỏi yêu thích' : 'Đã thêm vào yêu thích');
              }}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:border-red-500 transition group"
            >
              {isWishlist ? (
                <HeartSolidIcon className="h-5 w-5 text-red-500" />
              ) : (
                <HeartIcon className="h-5 w-5 text-gray-500 group-hover:text-red-500" />
              )}
            </motion.button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              🔒 Cam kết hàng chính hãng 100% <br />
              🚚 Giao hàng miễn phí cho đơn hàng từ 5 triệu <br />
              💯 Bảo hành 12 tháng tại tất cả các chi nhánh
            </p>
          </div>
        </div>
      </div>
      {zoomOpen && product.image_url && <ImageLightbox src={product.image_url} alt={product.name} onClose={closeZoom} />}
    </div>
  );
};

export default ProductDetail;