import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckIcon, XCircleIcon, ArrowPathIcon, StarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { orderService, MyOrderDetail } from '../services/orderService';
import { useCart } from '../hooks/useCart';
import { formatDate, formatPrice } from '../utils/formatters';
import { errorStatus } from '../services/api';
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, STATUS_BADGE, STATUS_LABEL, STEPS } from '../utils/orderStatus';
import { buyAgain } from '../utils/buyAgain';

/** Thanh tiến trình: bước nào đã qua + thời điểm (lấy từ lịch sử đổi trạng thái). */
function Progress({ order }: { order: MyOrderDetail }) {
  const timeOf = (status: string) => {
    const h = [...order.history].reverse().find((x) => x.status === status);
    return h ? h.at : status === 'pending' ? order.created_at : null;
  };
  if (order.status === 'cancelled') {
    const c = [...order.history].reverse().find((x) => x.status === 'cancelled');
    return (
      <div className="flex items-start gap-3 rounded-xl bg-gray-100 p-4 text-gray-700">
        <XCircleIcon className="h-7 w-7 shrink-0 text-gray-500" />
        <div>
          <p className="font-semibold">Đơn hàng đã hủy{c ? ` lúc ${formatDate(c.at)}` : ''}</p>
          {c?.note && <p className="mt-1 text-sm">{c.note}</p>}
        </div>
      </div>
    );
  }
  const current = STEPS.findIndex((s) => s.status === order.status);
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Tiến trình đơn hàng">
      {STEPS.map((s, i) => {
        const done = i <= current;
        const at = done ? timeOf(s.status) : null;
        return (
          <li key={s.status} className="relative flex flex-col items-center text-center" aria-current={i === current ? 'step' : undefined}>
            {i > 0 && <span className={`absolute right-1/2 top-4 h-1 w-full -translate-y-1/2 ${i <= current ? 'bg-green-500' : 'bg-gray-200'}`} aria-hidden />}
            <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white ${done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'} ${i === current ? 'scale-110' : ''}`}>
              {done ? <CheckIcon className="h-5 w-5" /> : <span className="text-sm font-semibold">{i + 1}</span>}
            </span>
            <span className={`mt-2 text-xs font-medium sm:text-sm ${done ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</span>
            {at && <span className="mt-0.5 text-[11px] text-gray-500 sm:text-xs">{formatDate(at)}</span>}
          </li>
        );
      })}
    </ol>
  );
}

/** /account/orders/:code — chi tiết + theo dõi 1 đơn của khách. */
export default function MyOrderDetailPage() {
  const { code = '' } = useParams();
  const { refreshCart } = useCart();
  const [order, setOrder] = useState<MyOrderDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      setOrder(await orderService.getMyOrder(code));
    } catch (error) {
      if (errorStatus(error) === 404) setNotFound(true);
      else setFailed(true);
    }
  }, [code]);

  useEffect(() => {
    document.title = `Đơn ${code} - Shoppc`;
    window.scrollTo({ top: 0 });
    void load();
  }, [code, load]);

  // Đơn đang xử lý: tự cập nhật khi cửa hàng đổi trạng thái (mỗi 30 giây, khi tab đang mở)
  const active = !!order && !['completed', 'cancelled'].includes(order.status);
  useEffect(() => {
    if (!active) return undefined;
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') void orderService.getMyOrder(code).then(setOrder).catch(() => undefined);
    }, 30000);
    return () => window.clearInterval(t);
  }, [active, code]);

  const cancel = async () => {
    setCancelling(true);
    try {
      setOrder(await orderService.cancelMyOrder(code, reason));
      toast.success('Đã hủy đơn hàng');
      setCancelOpen(false);
      void refreshCart();
    } catch {
      void load(); // trạng thái có thể vừa đổi (cửa hàng đã xác nhận)
    } finally {
      setCancelling(false);
    }
  };

  if (notFound) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <ExclamationTriangleIcon className="mx-auto h-14 w-14 text-amber-500" />
        <h1 className="mt-3 text-2xl font-bold text-gray-900">Không tìm thấy đơn hàng</h1>
        <p className="mt-2 text-gray-600">Đơn không tồn tại hoặc không thuộc tài khoản của bạn.</p>
        <Link to="/account/orders" className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">Về danh sách đơn</Link>
      </div>
    );
  }
  if (failed) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-gray-600">
        Không tải được đơn hàng. <button onClick={() => void load()} className="font-medium text-blue-600 hover:underline">Thử lại</button>
      </div>
    );
  }
  if (!order) return <div className="container mx-auto px-4 py-16 text-center text-gray-500">Đang tải đơn hàng…</div>;

  const received = ['delivered', 'completed'].includes(order.status);
  const needPay = order.payment_method === 'banking' && order.payment_status !== 'paid' && order.status !== 'cancelled';
  const address = [order.customer_address, order.customer_ward, order.customer_district, order.customer_city].filter(Boolean).join(', ');

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link to="/account/orders" className="text-sm font-medium text-blue-600 hover:underline">← Đơn hàng của tôi</Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đơn <span className="font-mono">{order.order_code}</span></h1>
          <p className="text-sm text-gray-500">Đặt lúc {formatDate(order.created_at)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_BADGE[order.status]}`}>{STATUS_LABEL[order.status]}</span>
      </div>

      <section className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <Progress order={order} />
        {order.status === 'pending' && <p className="mt-4 text-sm text-gray-600">Cửa hàng sẽ gọi điện xác nhận đơn trong thời gian sớm nhất.</p>}
        {order.status === 'shipped' && <p className="mt-4 text-sm text-gray-600">Đơn đang trên đường giao tới bạn{order.tracking_number ? ` — mã vận đơn ${order.tracking_number}` : ''}.</p>}
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_300px]">
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Sản phẩm</h2>
          <ul className="divide-y divide-gray-100">
            {order.items.map((it, i) => (
              <li key={`${it.product_id}-${i}`} className="flex items-center gap-3 py-3">
                <Link to={`/products/${it.product_id}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {it.product_image && <img src={it.product_image} alt="" className="h-full w-full object-contain" loading="lazy" />}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/products/${it.product_id}`} className="line-clamp-2 font-medium text-gray-900 hover:text-blue-600">{it.product_name}</Link>
                  <p className="text-sm text-gray-500">{formatPrice(Number(it.price))} x {it.quantity}</p>
                  {received && (
                    <Link to={`/products/${it.product_id}#danh-gia`} className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:underline">
                      <StarIcon className="h-4 w-4" /> Đánh giá sản phẩm
                    </Link>
                  )}
                </div>
                <span className="font-semibold text-gray-900">{formatPrice(Number(it.total))}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 border-t border-gray-100 pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-gray-600">Tạm tính</dt><dd>{formatPrice(Number(order.subtotal))}</dd></div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-green-700"><dt>Giảm giá{order.coupon_code ? ` (${order.coupon_code})` : ''}</dt><dd>-{formatPrice(Number(order.discount))}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-gray-600">Phí vận chuyển</dt><dd>{Number(order.shipping_fee) ? formatPrice(Number(order.shipping_fee)) : 'Miễn phí'}</dd></div>
            <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold"><dt>Tổng cộng</dt><dd className="text-red-600">{formatPrice(Number(order.total_amount))}</dd></div>
          </dl>
        </section>

        <aside className="space-y-6">
          <section className="rounded-xl bg-white p-5 shadow-sm text-sm">
            <h2 className="mb-2 text-base font-semibold text-gray-900">Giao tới</h2>
            <p className="font-medium text-gray-900">{order.customer_name}</p>
            <p className="text-gray-600">{order.customer_phone}</p>
            <p className="text-gray-600">{address}</p>
            {order.note && <p className="mt-2 text-gray-500">Ghi chú: {order.note}</p>}
          </section>
          <section className="rounded-xl bg-white p-5 shadow-sm text-sm">
            <h2 className="mb-2 text-base font-semibold text-gray-900">Thanh toán</h2>
            <p className="text-gray-700">{PAYMENT_METHOD_LABEL[order.payment_method] || order.payment_method}</p>
            <p className={order.payment_status === 'paid' ? 'font-medium text-green-700' : 'text-gray-600'}>{PAYMENT_STATUS_LABEL[order.payment_status] || order.payment_status}</p>
            {needPay && order.payment_claimed_at && (
              <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-blue-800">Bạn đã báo chuyển khoản — đang chờ cửa hàng xác nhận.</p>
            )}
            {needPay && (
              <Link to={`/order/${encodeURIComponent(order.order_code)}?phone=${encodeURIComponent(order.customer_phone)}`} className="mt-3 block rounded-lg bg-amber-500 px-4 py-2 text-center font-semibold text-white hover:bg-amber-600">
                Thanh toán (quét mã VietQR)
              </Link>
            )}
          </section>
          <div className="flex flex-col gap-2">
            {['delivered', 'completed', 'cancelled'].includes(order.status) && (
              <button onClick={() => void buyAgain(order, refreshCart)} className="inline-flex items-center justify-center gap-1 rounded-lg border border-blue-600 px-4 py-2 font-semibold text-blue-600 hover:bg-blue-50">
                <ArrowPathIcon className="h-5 w-5" /> Mua lại
              </button>
            )}
            {order.status === 'pending' && order.payment_status !== 'paid' && (
              <button onClick={() => setCancelOpen(true)} className="rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-600 hover:bg-red-50">Hủy đơn hàng</button>
            )}
          </div>
        </aside>
      </div>

      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div role="dialog" aria-modal="true" aria-label="Hủy đơn hàng" className="w-full max-w-md rounded-xl bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900">Hủy đơn {order.order_code}?</h2>
            <p className="mt-1 text-sm text-gray-600">Bạn chỉ hủy được khi cửa hàng chưa xác nhận đơn.</p>
            <label htmlFor="cancel-reason" className="mt-4 block text-sm font-medium text-gray-700">Lý do (không bắt buộc)</label>
            <select id="cancel-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">
              <option value="">— Chọn lý do —</option>
              <option>Muốn đổi sản phẩm / số lượng</option>
              <option>Muốn đổi địa chỉ giao hàng</option>
              <option>Tìm được giá tốt hơn</option>
              <option>Không còn nhu cầu</option>
              <option>Lý do khác</option>
            </select>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setCancelOpen(false)} disabled={cancelling} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">Không hủy</button>
              <button onClick={() => void cancel()} disabled={cancelling} className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50">{cancelling ? 'Đang hủy…' : 'Xác nhận hủy'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
