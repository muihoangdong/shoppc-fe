import React from 'react';
import { useCart } from '../../hooks/useCart';
import CartItem from './CartItem';
import { formatPrice } from '../../utils/formatters';
import { XMarkIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, loading, clearCart } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const handleClearCart = async () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?')) {
      await clearCart();
    }
  };

  // Tính tổng số lượng sản phẩm
  const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            transition={{ duration: 0.2 }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-bold">Giỏ hàng</h2>
                {cart.items.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {totalQuantity} sản phẩm
                  </p>
                )}
              </div>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Đóng"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : cart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <ShoppingBagIcon className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500">Giỏ hàng trống</p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-700"
                  >
                    Tiếp tục mua sắm
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.items.length > 0 && (
              <div className="border-t p-4 space-y-3 bg-white">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-gray-700">Tổng cộng:</span>
                  <span className="text-red-600 text-xl">{formatPrice(cart.total)}</span>
                </div>
                
                {/* Free shipping notice */}
                {cart.total < 5000000 && (
                  <p className="text-xs text-gray-500 text-center">
                    Cần thêm {formatPrice(5000000 - cart.total)} để được miễn phí vận chuyển
                  </p>
                )}
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleClearCart}
                    className="flex-1 px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                  >
                    Xóa tất cả
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Thanh toán
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;