import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import CartDrawer from '../Cart/CartDrawer';
import {
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  UserIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ClipboardDocumentListIcon,
  CpuChipIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../Common/ThemeToggle';
import Logo from '../Common/Logo';

const NAV = [
  { to: '/products', label: 'Sản phẩm', type: null },
  { to: '/products?type=pc', label: 'Máy tính', type: 'pc' },
  { to: '/products?type=component', label: 'Linh kiện', type: 'component' },
  { to: '/products?type=peripheral', label: 'Phụ kiện', type: 'peripheral' },
];

const TYPE_LABEL: Record<string, string> = { pc: 'Máy tính', component: 'Linh kiện máy tính', peripheral: 'Phụ kiện' };

/** Đường dẫn "Trang chủ / ..." theo trang đang mở */
const crumbsFor = (pathname: string, search: string): { to?: string; label: string }[] => {
  const q = new URLSearchParams(search);
  const type = q.get('type');
  if (pathname === '/') return [];
  if (pathname === '/products') {
    const list: { to?: string; label: string }[] = [{ to: '/products', label: 'Sản phẩm' }];
    if (type && TYPE_LABEL[type]) list.push({ label: TYPE_LABEL[type] });
    if (q.get('search')) list.push({ label: `Tìm "${q.get('search')}"` });
    return list;
  }
  if (pathname.startsWith('/products/')) return [{ to: '/products', label: 'Sản phẩm' }, { label: 'Chi tiết sản phẩm' }];
  const map: Record<string, string> = {
    '/cart': 'Giỏ hàng',
    '/checkout': 'Thanh toán',
    '/build-pc': 'Xây dựng PC',
    '/account': 'Tài khoản',
    '/account/orders': 'Đơn hàng của tôi',
    '/login': 'Đăng nhập',
    '/register': 'Đăng ký',
    '/forgot-password': 'Quên mật khẩu',
    '/reset-password': 'Đặt lại mật khẩu',
    '/privacy': 'Chính sách bảo mật',
    '/terms': 'Điều khoản sử dụng',
    '/return': 'Chính sách đổi trả',
  };
  if (pathname.startsWith('/account/orders/')) return [{ to: '/account/orders', label: 'Đơn hàng của tôi' }, { label: 'Chi tiết đơn' }];
  if (pathname.startsWith('/order/')) return [{ label: 'Tra cứu đơn hàng' }];
  return map[pathname] ? [{ label: map[pathname] }] : [];
};

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);

const Header: React.FC = () => {
  const { cart } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const currentType = new URLSearchParams(location.search).get('type');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMobileMenuOpen(false);
      searchRef.current?.blur();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
    setUserMenu(false);
  };

  // Ctrl/⌘ + K hoặc "/" để tìm kiếm nhanh
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName) || (e.target as HTMLElement)?.isContentEditable;
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) setIsMobileMenuOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Đóng menu khi chuyển trang
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setUserMenu(false);
  }, [location]);

  // Lấy tên hiển thị (ưu tiên full_name, sau đó username)
  const displayName = user?.full_name || user?.username || 'User';
  const getInitial = () => displayName.charAt(0).toUpperCase();
  const crumbs = crumbsFor(location.pathname, location.search);

  const navActive = (type: string | null) => location.pathname === '/products' && (currentType || null) === type;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3 lg:gap-6">
          <Link to="/" className="shrink-0" aria-label="Shoppc - Trang chủ">
            <Logo />
          </Link>

          {/* Tìm kiếm */}
          <form onSubmit={handleSearch} className="hidden min-w-[160px] max-w-sm flex-1 md:block" role="search">
            <label className="relative block">
              <span className="sr-only">Tìm kiếm phần cứng</span>
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                type="search"
                placeholder="Tìm kiếm phần cứng…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="frost-input !rounded-lg !py-2 pl-9 pr-14"
              />
              <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 lg:block">
                {isMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            </label>
          </form>

          {/* Điều hướng */}
          <nav className="ml-auto hidden items-center gap-5 lg:flex" aria-label="Danh mục chính">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`text-sm font-medium transition-colors ${navActive(item.type) ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
            <NavLink
              to="/build-pc"
              className={({ isActive }) =>
                `hidden items-center gap-1.5 rounded-lg px-3 py-2 font-mono text-xs font-semibold tracking-wide text-white shadow-sm transition sm:inline-flex ${
                  isActive ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
                }`
              }
            >
              <CpuChipIcon className="h-4 w-4" /> Xây Dựng PC
            </NavLink>

            <ThemeToggle />

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsCartOpen(true)}
              aria-label={`Giỏ hàng (${cart.total_items} sản phẩm)`}
              className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <ShoppingCartIcon className="h-5 w-5" />
              {cart.total_items > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                  {cart.total_items > 99 ? '99+' : cart.total_items}
                </span>
              )}
            </motion.button>

            {/* Tài khoản */}
            <div ref={userMenuRef} className="relative hidden md:block">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => setUserMenu((v) => !v)}
                  aria-expanded={userMenu}
                  aria-label="Menu tài khoản"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                >
                  {getInitial()}
                </button>
              ) : (
                <Link to="/login" aria-label="Đăng nhập" title="Đăng nhập" className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition hover:bg-blue-700">
                  <UserIcon className="h-5 w-5" />
                </Link>
              )}
              {userMenu && isAuthenticated && (
                <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <Link to="/account" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    <UserCircleIcon className="h-4 w-4" /> Tài khoản của tôi
                  </Link>
                  <Link to="/account/orders" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    <ClipboardDocumentListIcon className="h-4 w-4" /> Đơn hàng của tôi
                  </Link>
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 border-t border-slate-200 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    <ArrowRightOnRectangleIcon className="h-4 w-4" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Mở menu"
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            >
              {isMobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Tìm kiếm trên điện thoại */}
        <div className="px-4 pb-3 md:hidden">
          <form onSubmit={handleSearch} role="search">
            <label className="relative block">
              <span className="sr-only">Tìm kiếm phần cứng</span>
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Tìm kiếm phần cứng…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="frost-input !py-2 pl-9"
              />
            </label>
          </form>
        </div>

        {/* Đường dẫn + thông tin cửa hàng */}
        <div className="border-t border-slate-200 bg-slate-50/80">
          <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-1.5 font-mono text-[11px] text-slate-500">
            <nav aria-label="Đường dẫn" className="flex min-w-0 items-center gap-1.5 truncate">
              <Link to="/" className="flex items-center gap-1 hover:text-blue-600">
                <HomeIcon className="h-3.5 w-3.5" /> Trang chủ
              </Link>
              {crumbs.map((c, i) => (
                <React.Fragment key={i}>
                  <span className="text-slate-300">/</span>
                  {c.to && i < crumbs.length - 1 ? (
                    <Link to={c.to} className="hover:text-blue-600">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="truncate font-semibold text-slate-700">{c.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
            <p className="hidden shrink-0 items-center gap-3 md:flex">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Giao hàng toàn quốc · Hàng chính hãng
              </span>
              <span className="text-slate-300">•</span>
              <a href="tel:0354334944" className="hover:text-blue-600">
                Hotline: 0354 334 944
              </a>
            </p>
          </div>
        </div>
      </header>

      {/* Menu trên điện thoại */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed left-0 top-0 z-50 h-full w-72 border-r border-slate-200 bg-white shadow-xl lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <Logo />
              <button onClick={() => setIsMobileMenuOpen(false)} aria-label="Đóng menu" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-3">
              <p className="frost-label px-3 pb-1 pt-2">Danh mục</p>
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium ${navActive(item.type) ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  {item.label}
                </Link>
              ))}
              <Link to="/build-pc" className="frost-btn mx-1 mt-2">
                <CpuChipIcon className="h-4 w-4" /> Xây Dựng PC
              </Link>

              <p className="frost-label px-3 pb-1 pt-5">Tài khoản</p>
              {isAuthenticated ? (
                <>
                  <Link to="/account" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">{getInitial()}</span>
                    <span className="truncate">{displayName}</span>
                  </Link>
                  <Link to="/account/orders" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    <ClipboardDocumentListIcon className="h-5 w-5" /> Đơn hàng của tôi
                  </Link>
                  <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    <ArrowRightOnRectangleIcon className="h-5 w-5" /> Đăng xuất
                  </button>
                </>
              ) : (
                <Link to="/login" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                  <UserCircleIcon className="h-5 w-5" /> Đăng nhập
                </Link>
              )}
              <button
                onClick={() => {
                  setIsCartOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <ShoppingCartIcon className="h-5 w-5" /> Giỏ hàng ({cart.total_items})
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
