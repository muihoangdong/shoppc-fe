import { HeartIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useCustomer } from '../../contexts/CustomerContext';
import { useAuth } from '../../hooks/useAuth';

export function WishlistButton({ id }: { id: number }) {
  const { data, busy, toggle } = useCustomer();
  const { user } = useAuth();
  const saved = data.wishlist.includes(id);
  return <button type="button" aria-label={saved ? 'Bỏ yêu thích' : 'Lưu yêu thích'} aria-pressed={saved} disabled={busy.has(`${user?.id}:wishlist:${id}`)}
    onClick={(e) => { e.preventDefault(); e.stopPropagation(); void toggle('wishlist', id); }}
    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-red-500 shadow-sm hover:bg-red-50 disabled:opacity-50">
    {saved ? <HeartSolidIcon className="h-5 w-5" /> : <HeartIcon className="h-5 w-5" />}
  </button>;
}

export function StockAlertButton({ id }: { id: number }) {
  const { data, busy, toggle } = useCustomer();
  const { user } = useAuth();
  const watching = data.alerts.includes(id);
  return <button type="button" aria-pressed={watching} disabled={busy.has(`${user?.id}:alerts:${id}`)}
    onClick={(e) => { e.preventDefault(); e.stopPropagation(); void toggle('alerts', id); }}
    className={`frost-btn-ghost w-full !py-2 ${watching ? '!text-blue-700' : ''}`}>
    <BellAlertIcon className="h-4 w-4" />{watching ? 'Hủy báo hàng về' : 'Báo hàng về qua email'}
  </button>;
}
