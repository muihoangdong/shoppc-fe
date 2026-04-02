import React from 'react';
import { CartItem as CartItemType } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { useCart } from '../../hooks/useCart';
import { TrashIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleUpdateQuantity = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= item.stock) {
      updateQuantity(item.product_id, newQuantity);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex gap-4 p-4 bg-gray-50 rounded-lg"
    >
      {/* Product Image */}
      <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1">
        <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
        <p className="text-red-600 font-bold mb-2">{formatPrice(item.price)}</p>
        
        <div className="flex items-center justify-between">
          {/* Quantity Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleUpdateQuantity(item.quantity - 1)}
              className="p-1 rounded hover:bg-gray-200 transition"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="w-12 text-center font-semibold">{item.quantity}</span>
            <button
              onClick={() => handleUpdateQuantity(item.quantity + 1)}
              disabled={item.quantity >= item.stock}
              className={`p-1 rounded transition ${
                item.quantity < item.stock
                  ? 'hover:bg-gray-200'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Total Price */}
          <div className="text-right">
            <p className="font-bold text-blue-600">
              {formatPrice(item.price * item.quantity)}
            </p>
            <button
              onClick={() => removeFromCart(item.product_id)}
              className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 mt-1"
            >
              <TrashIcon className="h-4 w-4" />
              Xóa
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CartItem;