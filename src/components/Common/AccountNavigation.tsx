import { NavLink } from 'react-router-dom';

const links = [
  ['/account', 'Tài khoản'],
  ['/account/orders', 'Đơn hàng'],
  ['/account/wishlist', 'Yêu thích'],
  ['/account/warranty', 'Bảo hành'],
  ['/account/returns', 'Đổi trả'],
  ['/account/stock-alerts', 'Báo hàng về'],
];
export default function AccountNavigation() {
  return (
    <nav aria-label="Dịch vụ tài khoản" className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-white p-2">
      {links.map(([path, label]) => (
        <NavLink
          key={path}
          to={path}
          end={path === '/account'}
          className={({ isActive }) =>
            `shrink-0 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
