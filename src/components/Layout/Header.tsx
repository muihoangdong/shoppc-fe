import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import CartDrawer from '../Cart/CartDrawer';
import { 
  ShoppingCartIcon, 
  MagnifyingGlassIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

const Header: React.FC = () => {
  const { cart } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  // Đóng menu mobile khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Đóng menu mobile khi chuyển trang
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Lấy tên hiển thị (ưu tiên full_name, sau đó username)
  const displayName = user?.full_name || user?.username || 'User';

  // Lấy chữ cái đầu để hiển thị avatar
  const getInitial = () => {
    if (user?.full_name) return user.full_name.charAt(0).toUpperCase();
    if (user?.username) return user.username.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <>
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-2xl font-bold bg-white text-blue-600 px-3 py-1 rounded-lg"
              >
                SHOPPC
              </motion.div>
            </Link>

            {/* Desktop Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pr-10 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </form>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                to="/products" 
                className={`hover:text-yellow-300 transition-colors ${location.pathname === '/products' ? 'text-yellow-300' : ''}`}
              >
                Sản phẩm
              </Link>
              <Link 
                to="/products?type=pc" 
                className="hover:text-yellow-300 transition-colors"
              >
                Máy tính
              </Link>
              <Link 
                to="/products?type=component" 
                className="hover:text-yellow-300 transition-colors"
              >
                Linh kiện
              </Link>
              <Link 
                to="/products?type=peripheral" 
                className="hover:text-yellow-300 transition-colors"
              >
                Phụ kiện
              </Link>

              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <Link to="/account" className="flex items-center gap-2 hover:text-yellow-300 transition-colors group">
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-blue-800 font-bold">
                      {getInitial()}
                    </div>
                    <span className="max-w-[120px] truncate">{displayName}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-1 hover:text-yellow-300 transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              ) : (
                <Link to="/login" className="hover:text-yellow-300 transition-colors">
                  Đăng nhập
                </Link>
              )}
              
              {/* Cart Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCartOpen(true)}
                className="relative bg-blue-700 p-2 rounded-full hover:bg-blue-800 transition-colors"
              >
                <ShoppingCartIcon className="h-6 w-6" />
                {cart.total_items > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-blue-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.total_items}
                  </span>
                )}
              </motion.button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-blue-800 transition-colors"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pr-10 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </form>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 md:hidden"
          >
            <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
              <h2 className="text-xl font-bold text-white">SHOPPC</h2>
            </div>
            <nav className="flex flex-col p-4 space-y-3">
              <Link 
                to="/products" 
                className="text-gray-700 hover:text-blue-600 py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                📦 Sản phẩm
              </Link>
              <Link 
                to="/products?type=pc" 
                className="text-gray-700 hover:text-blue-600 py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                💻 Máy tính
              </Link>
              <Link 
                to="/products?type=component" 
                className="text-gray-700 hover:text-blue-600 py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🔧 Linh kiện
              </Link>
              <Link 
                to="/products?type=peripheral" 
                className="text-gray-700 hover:text-blue-600 py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🖱️ Phụ kiện
              </Link>
              
              <div className="border-t my-2 pt-2">
                {isAuthenticated ? (
                  <>
                    <Link 
                      to="/account" 
                      className="flex items-center gap-3 text-gray-700 hover:text-blue-600 py-2 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {getInitial()}
                      </div>
                      <span>{displayName}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 text-red-600 hover:text-red-700 py-2 w-full transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <Link 
                    to="/login" 
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-600 py-2 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <UserCircleIcon className="h-5 w-5" />
                    Đăng nhập
                  </Link>
                )}
              </div>
              
              <button
                onClick={() => {
                  setIsCartOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 text-gray-700 hover:text-blue-600 py-2 transition-colors"
              >
                <ShoppingCartIcon className="h-5 w-5" />
                Giỏ hàng ({cart.total_items})
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Header;