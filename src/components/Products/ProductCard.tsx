import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCartIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Product } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { useCart } from '../../hooks/useCart';
import FadeImage from '../Common/FadeImage';

interface ProductCardProps {
  product: Product;
}

/** Thẻ sản phẩm: cả thẻ là một liên kết (mở tab mới được), nút giỏ hàng có trạng thái đang thêm / đã thêm. */
const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // không mở trang chi tiết khi bấm nút giỏ hàng
    e.stopPropagation();
    if (adding || outOfStock) return;
    setAdding(true);
    await addToCart(product.id);
    setAdding(false);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        {product.image_url ? (
          <FadeImage
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain p-2 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">No Image</div>
        )}
        {outOfStock && <div className="absolute right-2 top-2 rounded bg-red-500 px-2 py-1 text-xs text-white">Hết hàng</div>}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-gray-900 sm:text-base">{product.name}</h3>
        {product.description && <p className="mb-2 hidden text-sm text-gray-600 sm:line-clamp-2">{product.description}</p>}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-base font-bold text-red-600 sm:text-xl">{formatPrice(product.price)}</span>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock || adding}
            aria-label={outOfStock ? 'Hết hàng' : `Thêm ${product.name} vào giỏ hàng`}
            className={`shrink-0 rounded-full p-2 transition active:scale-90 ${
              outOfStock
                ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                : added
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {adding ? (
              <span className="block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : added ? (
              <CheckIcon className="h-5 w-5" />
            ) : (
              <ShoppingCartIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
