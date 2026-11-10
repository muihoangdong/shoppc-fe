import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { customerService, ReturnItem, ReturnRecord, StockAlert, WarrantyRecord } from '../services/customerService';
import { Product } from '../types';
import { useCustomer } from '../contexts/CustomerContext';
import ProductCard from '../components/Products/ProductCard';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { errorMessage } from '../services/api';
import { formatPrice } from '../utils/formatters';

export type CustomerPageKind = 'wishlist' | 'warranty' | 'returns' | 'alerts';
const titles = { wishlist: 'Danh sách yêu thích', warranty: 'Tra cứu bảo hành', returns: 'Yêu cầu đổi trả', alerts: 'Báo hàng về qua email' };
const statuses: Record<string, string> = { requested: 'Chờ duyệt', approved: 'Đã duyệt', received: 'Đã tiếp nhận', refunded: 'Đã ghi nhận hoàn tiền', closed: 'Đã kết thúc', rejected: 'Từ chối', cancelled: 'Đã hủy', diagnosing: 'Đang kiểm tra', repairing: 'Đang sửa chữa', resolved: 'Đã xử lý', sold: 'Đã bán', repair: 'Đang bảo hành', returned: 'Đã trả hàng' };
const date = (value: string | null) => value ? new Date(value).toLocaleDateString('vi-VN') : '—';
export const CustomerLinks = () => <nav aria-label="Dịch vụ tài khoản" className="mb-6 flex flex-wrap gap-2">{(Object.keys(titles) as CustomerPageKind[]).map((key) => <Link key={key} to={`/account/${key === 'alerts' ? 'stock-alerts' : key}`} className="frost-btn-ghost !py-2 text-sm">{titles[key]}</Link>)}</nav>;

export default function CustomerAccountPage({ kind }: { kind: CustomerPageKind }) {
  const { data, refresh, toggle } = useCustomer();
  const [params] = useSearchParams();
  const orderCode = params.get('order') || '';
  const [products, setProducts] = useState<Product[]>([]), [warranties, setWarranties] = useState<WarrantyRecord[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]), [items, setItems] = useState<ReturnItem[]>([]), [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [search, setSearch] = useState(''), [submittedSearch, setSubmittedSearch] = useState('');
  const [itemId, setItemId] = useState(''), [quantity, setQuantity] = useState(1), [reason, setReason] = useState('');
  const selected = items.find((i) => i.id === Number(itemId));
  const load = useCallback(async () => {
    setError(''); setLoading(true);
    try {
      if (kind === 'wishlist') setProducts(await customerService.wishlist());
      if (kind === 'warranty') setWarranties(await customerService.warranties(submittedSearch));
      if (kind === 'returns') { const [r, i] = await Promise.all([customerService.returns(), customerService.returnItems(orderCode)]); setReturns(r); setItems(i); }
      if (kind === 'alerts') { setAlerts(await customerService.alerts()); await refresh(); }
    } catch (e) { setError(errorMessage(e, 'Không tải được dữ liệu. Vui lòng thử lại.')); }
    finally { setLoading(false); }
  }, [kind, orderCode, submittedSearch, refresh]);
  const wishlistVersion = kind === 'wishlist' ? data.wishlist.join(',') : '';
  useEffect(() => { void load(); }, [load, wishlistVersion]);
  const run = async (action: () => Promise<void>) => { if (busy) return; setBusy(true); try { await action(); await load(); } catch { /* api reports errors */ } finally { setBusy(false); } };
  return <div className="container mx-auto max-w-6xl px-4 py-8">
    <Link to="/account" className="text-sm text-blue-600 hover:underline">← Tài khoản của tôi</Link>
    <h1 className="mb-4 mt-3 text-2xl font-bold text-slate-900">{titles[kind]}</h1>
    <CustomerLinks />
    {kind === 'wishlist' && <p className="mb-5 text-sm text-slate-500">Sản phẩm đã lưu theo tài khoản, đồng bộ khi đăng nhập trên thiết bị khác.</p>}
    {kind === 'warranty' && <><p className="mb-4 text-sm text-slate-500">Tra cứu serial được gán vào đơn của bạn và tiến độ phiếu bảo hành. Nếu chưa thấy serial, hãy liên hệ cửa hàng kèm mã đơn.</p>
      <form onSubmit={(e) => { e.preventDefault(); setSubmittedSearch(search.trim()); }} className="mb-5 flex gap-2"><label className="flex-1"><span className="sr-only">Serial hoặc mã đơn</span><input className="frost-input" value={search} maxLength={150} onChange={(e) => setSearch(e.target.value)} placeholder="Nhập serial hoặc mã đơn" /></label><button className="frost-btn" type="submit">Tra cứu</button></form></>}
    {kind === 'alerts' && <p className="mb-5 text-sm text-slate-500">Gửi tới email tài khoản: <b>{data.email || 'Đang tải…'}</b>. Mỗi đăng ký nhận một email khi sản phẩm có hàng. Tồn kho được kiểm tra mỗi phút.{!data.mail_available && ' Cửa hàng chưa bật dịch vụ email báo hàng về.'}</p>}
    {error ? <div role="alert" className="frost-card p-6"><p className="text-red-600">{error}</p><button type="button" onClick={() => void load()} className="frost-btn-ghost mt-3">Thử lại</button></div> : loading ? <LoadingSpinner /> : <>
      {kind === 'wishlist' && (products.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div> : <Empty text="Bạn chưa lưu sản phẩm yêu thích." />)}
      {kind === 'warranty' && (warranties.length ? <div className="space-y-4">{warranties.map((w) => <section key={w.id} className="frost-card p-5">
        <div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-bold text-slate-900">{w.product_name}</h2><p className="text-sm text-slate-600">Serial: <b>{w.serial_number}</b> · Đơn {w.order_code}</p></div><span className="frost-chip">{statuses[w.status] || w.status}</span></div>
        <p className="mt-3 text-sm text-slate-700">Bắt đầu: {date(w.sold_at)} · Hết hạn: {date(w.warranty_expires_at)} · <b>{w.warranty_expires_at && new Date(w.warranty_expires_at).getTime() > Date.now() ? 'Trong thời hạn bảo hành' : 'Đã hết thời hạn bảo hành'}</b></p>
        {w.tickets.length > 0 && <div className="mt-4 space-y-2 border-t border-slate-200 pt-3">{w.tickets.map((t) => <article key={t.id} className="rounded-lg bg-slate-50 p-3 text-sm"><b>{t.ticket_code}</b> · {statuses[t.status] || t.status}<p className="mt-1 whitespace-pre-wrap text-slate-600">{t.issue}</p>{t.resolution && <p className="mt-1 whitespace-pre-wrap">Kết quả: {t.resolution}</p>}<p className="mt-1 text-xs text-slate-500">Tiếp nhận {date(t.created_at)}{t.completed_at && ` · Hoàn tất ${date(t.completed_at)}`}</p></article>)}</div>}
      </section>)}</div> : <Empty text="Chưa tìm thấy serial bảo hành phù hợp trong đơn của bạn." />)}
      {kind === 'alerts' && (alerts.length ? <div className="space-y-3">{alerts.map((a) => <article key={a.product_id} className="frost-card flex flex-wrap items-center justify-between gap-3 p-4"><div><Link to={`/products/${a.product_id}`} className="font-semibold text-blue-600">{a.name}</Link><p className="text-sm text-slate-500">{a.status === 'notified' ? `Đã gửi email ${date(a.notified_at)}` : 'Đang chờ hàng về'}</p></div>{a.status === 'pending' && <button disabled={busy} type="button" className="frost-btn-ghost" onClick={() => void run(async () => { await toggle('alerts', a.product_id); })}>Hủy đăng ký</button>}</article>)}</div> : <Empty text="Bạn chưa đăng ký báo hàng về." />)}
      {kind === 'returns' && <>
        <p className="mb-4 text-sm text-slate-500">Chỉ tạo yêu cầu cho hàng đã giao. Cửa hàng sẽ kiểm tra điều kiện đổi trả và xác nhận số tiền hoàn; phí vận chuyển không nằm trong số tiền dự kiến.</p>
        {items.length ? <form className="frost-card mb-6 space-y-4 p-5" onSubmit={(e) => { e.preventDefault(); if (!selected || !reason.trim() || quantity > selected.available_quantity) return; void run(async () => { await customerService.createReturn({ order_item_id: Number(itemId), quantity, reason: reason.trim() }); setItemId(''); setQuantity(1); setReason(''); toast.success('Đã gửi yêu cầu tới cửa hàng'); }); }}>
          <h2 className="font-bold text-slate-900">Tạo yêu cầu đổi trả{orderCode ? ` · ${orderCode}` : ''}</h2>
          <label className="block text-sm">Sản phẩm cần trả<select required className="frost-input mt-1" value={itemId} onChange={(e) => { setItemId(e.target.value); setQuantity(1); }}><option value="">— Chọn hàng trong đơn đã giao —</option>{items.map((i) => <option key={i.id} value={i.id}>{i.order_code} · {i.product_name} · còn {i.available_quantity} sản phẩm được yêu cầu</option>)}</select></label>
          <label className="block text-sm">Số lượng<input required className="frost-input mt-1 max-w-32" type="number" min={1} max={selected?.available_quantity || 1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /></label>
          <label className="block text-sm">Lý do và tình trạng sản phẩm<textarea required maxLength={3000} rows={4} className="frost-input mt-1" value={reason} onChange={(e) => setReason(e.target.value)} /></label>
          <button disabled={busy || !selected || !reason.trim()} type="submit" className="frost-btn">{busy ? 'Đang gửi…' : 'Gửi yêu cầu đổi trả'}</button>
        </form> : <Empty text="Chưa có hàng đã giao đủ điều kiện tạo yêu cầu mới. Với đơn cũ hơn, mở chi tiết đơn rồi chọn Yêu cầu đổi trả." />}
        <h2 className="mb-3 text-lg font-bold text-slate-900">Lịch sử yêu cầu</h2>
        {returns.length ? <div className="space-y-3">{returns.map((r) => <article key={r.id} className="frost-card p-5"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-slate-900">{r.return_code} · {r.order_code}</h3><span className="frost-chip">{statuses[r.status] || r.status}</span></div><p className="mt-2 text-sm">{r.quantity} × {r.product_name}</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-500">{r.reason}</p><p className="mt-2 text-sm">{r.status === 'requested' ? 'Tiền hoàn dự kiến' : 'Tiền hoàn theo phiếu'}: <b>{formatPrice(Number(r.refund_amount))}</b> · {date(r.created_at)}</p>{r.status === 'requested' && <button type="button" disabled={busy} className="frost-btn-ghost mt-3" onClick={() => void run(() => customerService.cancelReturn(r.id))}>Hủy yêu cầu</button>}</article>)}</div> : <Empty text="Bạn chưa có yêu cầu đổi trả." />}
      </>}
    </>}
  </div>;
}
function Empty({ text }: { text: string }) { return <div className="frost-card p-8 text-center"><p className="text-slate-500">{text}</p><Link to="/products" className="mt-3 inline-block text-blue-600 hover:underline">Xem sản phẩm</Link></div>; }
