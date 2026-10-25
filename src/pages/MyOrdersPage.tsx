import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShoppingBagIcon, ArrowPathIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { orderService, MyOrder, MyOrdersPage as PageData, OrderGroup } from '../services/orderService';
import { useCart } from '../hooks/useCart';
import { formatDate, formatPrice } from '../utils/formatters';
import { GROUP_TABS, STATUS_BADGE, STATUS_LABEL } from '../utils/orderStatus';
import { buyAgain } from '../utils/buyAgain';

const GROUPS: (OrderGroup | '')[] = GROUP_TABS.map((t) => t.value);

function OrderCard({ order, onBuyAgain }: { order: MyOrder; onBuyAgain: (o: MyOrder) => void }) {
  const shown = order.items.slice(0, 3);
  const more = order.items.length - shown.length;
  const needPay = order.payment_method === 'banking' && order.payment_status !== 'paid' && order.status !== 'cancelled';
  return (
    <li className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
        <div className="text-sm">
          <span className="font-semibold text-gray-900">{order.order_code}</span>
          <span className="ml-2 text-gray-500">{formatDate(order.created_at)}</span>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[order.status]}`}>{STATUS_LABEL[order.status]}</span>
      </div>
      <Link to={`/account/orders/${encodeURIComponent(order.order_code)}`} className="block px-4 py-3 hover:bg-gray-50">
        <ul className="space-y-3">
          {shown.map((it, i) => (
            <li key={`${it.product_id}-${i}`} className="flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {it.product_image && <img src={it.product_image} alt="" className="h-full w-full object-contain" loading="lazy" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">{it.product_name}</p>
                <p className="text-sm text-gray-500">x{it.quantity}</p>
              </div>
              <span className="text-sm text-gray-700">{formatPrice(Number(it.total))}</span>
            </li>
          ))}
        </ul>
        {more > 0 && <p className="mt-2 text-sm text-gray-500">và {more} sản phẩm khác</p>}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
        <p className="text-sm text-gray-600">
          Thành tiền: <span className="text-lg font-bold text-red-600">{formatPrice(Number(order.total_amount))}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {needPay && (
            <Link to={`/order/${encodeURIComponent(order.order_code)}?phone=${encodeURIComponent(order.customer_phone)}`} className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-600">
              Thanh toán
            </Link>
          )}
          {['delivered', 'completed', 'cancelled'].includes(order.status) && (
            <button type="button" onClick={() => onBuyAgain(order)} className="inline-flex items-center gap-1 rounded-lg border border-blue-600 px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-50">
              <ArrowPathIcon className="h-4 w-4" /> Mua lại
            </button>
          )}
          <Link to={`/account/orders/${encodeURIComponent(order.order_code)}`} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">
            Xem chi tiết <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </li>
  );
}

/** /account/orders — lịch sử mua hàng + theo dõi đơn đang giao. */
export default function MyOrdersPage() {
  const { refreshCart } = useCart();
  const [params, setParams] = useSearchParams();
  const groupParam = params.get('tab') || '';
  const group = (GROUPS.includes(groupParam as OrderGroup) ? groupParam : '') as OrderGroup | '';
  const page = Math.max(Number(params.get('page')) || 1, 1);
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setData(await orderService.getMyOrders(group, page));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [group, page]);

  useEffect(() => {
    document.title = 'Đơn hàng của tôi - Shoppc';
    void load();
  }, [load]);

  const setTab = (value: OrderGroup | '') => setParams(value ? { tab: value } : {});
  const setPage = (p: number) => {
    setParams({ ...(group ? { tab: group } : {}), page: String(p) });
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đơn hàng của tôi</h1>
          <p className="text-sm text-gray-500">Theo dõi đơn đang giao và xem lại lịch sử mua hàng.</p>
        </div>
        <Link to="/account" className="text-sm font-medium text-blue-600 hover:underline">← Tài khoản</Link>
      </div>

      <div className="mb-5 -mx-4 overflow-x-auto px-4">
        <div className="flex min-w-max gap-2" role="tablist">
          {GROUP_TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={group === t.value}
              onClick={() => setTab(t.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${group === t.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'}`}
            >
              {t.label}
              {data && data.meta.counts[t.key] > 0 && <span className="ml-1 opacity-80">({data.meta.counts[t.key]})</span>}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <p className="py-16 text-center text-gray-500">Đang tải đơn hàng…</p>
      ) : failed ? (
        <div className="py-16 text-center text-gray-600">
          Không tải được đơn hàng.{' '}
          <button onClick={() => void load()} className="font-medium text-blue-600 hover:underline">Thử lại</button>
        </div>
      ) : data && data.data.length === 0 ? (
        <div className="rounded-xl bg-white py-16 text-center shadow-sm">
          <ShoppingBagIcon className="mx-auto h-14 w-14 text-gray-300" />
          <p className="mt-3 text-gray-600">{group ? 'Không có đơn nào trong mục này.' : 'Bạn chưa có đơn hàng nào.'}</p>
          <Link to="/products" className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700">Mua sắm ngay</Link>
        </div>
      ) : (
        data && (
          <>
            <ul className={`space-y-4 ${loading ? 'opacity-60' : ''}`}>
              {data.data.map((o) => <OrderCard key={o.id} order={o} onBuyAgain={(x) => void buyAgain(x, refreshCart)} />)}
            </ul>
            {data.meta.pages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-40">Trang trước</button>
                <span className="text-sm text-gray-600">Trang {data.meta.page}/{data.meta.pages}</span>
                <button disabled={page >= data.meta.pages} onClick={() => setPage(page + 1)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-40">Trang sau</button>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
