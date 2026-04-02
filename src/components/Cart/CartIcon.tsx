import React from 'react';
import { useCart } from '../../hooks/useCart';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface CartIconProps {
  onClick: () => void;
}

const CartIcon: React.FC<CartIconProps> = ({ onClick }) => {
  const { cart } = useCart();
  
  const totalItems = cart.total_items;

  return (
    <button 
      onClick={onClick} 
      className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      aria-label="Giỏ hàng"
    >
      <ShoppingCartIcon className="h-6 w-6 text-gray-700" />
      
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center shadow-md"
          >
            {totalItems > 99 ? '99+' : totalItems}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

export default CartIcon;