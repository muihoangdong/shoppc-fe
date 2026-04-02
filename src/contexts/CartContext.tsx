import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cartService } from '../services/cartService';
import { Cart } from '../types';
import toast from 'react-hot-toast';

export interface CartContextType {
  cart: Cart;
  loading: boolean;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart>({ items: [], total: 0, total_items: 0 });
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cartService.getCart();
      setCart(data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = useCallback(async (productId: number, quantity: number = 1) => {
    try {
      await cartService.addToCart(productId, quantity);
      await refreshCart();
      toast.success('Đã thêm vào giỏ hàng');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Không thể thêm vào giỏ hàng');
    }
  }, [refreshCart]);

  const updateQuantity = useCallback(async (productId: number, quantity: number) => {
    try {
      await cartService.updateCartItem(productId, quantity);
      await refreshCart();
    } catch (error) {
      console.error('Failed to update quantity:', error);
      toast.error('Không thể cập nhật số lượng');
    }
  }, [refreshCart]);

  const removeFromCart = useCallback(async (productId: number) => {
    try {
      await cartService.removeFromCart(productId);
      await refreshCart();
      toast.success('Đã xóa khỏi giỏ hàng');
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      toast.error('Không thể xóa sản phẩm');
    }
  }, [refreshCart]);

  const clearCart = useCallback(async () => {
    try {
      await cartService.clearCart();
      await refreshCart();
      toast.success('Đã xóa toàn bộ giỏ hàng');
    } catch (error) {
      console.error('Failed to clear cart:', error);
      toast.error('Không thể xóa giỏ hàng');
    }
  }, [refreshCart]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const value = useMemo(
    () => ({ cart, loading, addToCart, updateQuantity, removeFromCart, clearCart, refreshCart }),
    [cart, loading, addToCart, updateQuantity, removeFromCart, clearCart, refreshCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
