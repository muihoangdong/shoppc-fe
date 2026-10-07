import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  ClipboardDocumentIcon,
  BanknotesIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { orderService, PaymentInfo } from '../services/orderService';
import { formatPrice } from '../utils/formatters';
import { errorStatus } from '../services/api';

const POLL_MS = 5000;
const POLL_CLAIMED_MS = 10000; // đã báo chuyển khoản: hỏi lại mỗi 10 giây chờ cửa hàng xác nhận
const POLL_MAX_MS = 30 * 60 * 1000; // tự kiểm tra tối đa 30 phút

const copy = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  } catch {
    toast.error('Trình duyệt không cho sao chép, vui lòng chép tay');
  }
};

const Row = ({ label, value, copyValue, strong }: { label: string; value: string; copyValue?: string; strong?: boolean }) => (
  <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-2.5 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="flex items-center gap-2 text-right">
      <span className={`${strong ? 'text-lg font-bold text-blue-600' : 'font-semibold text-gray-900'} break-all`}>{value}</span>
      {copyValue && (
        <button type="button" onClick={() => copy(copyValue, label.toLowerCase())} aria-label={`Sao chép ${label}`} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600">
          <ClipboardDocumentIcon className="h-5 w-5" />
        </button>
      )}
    </span>
  </div>
);

/** Trang sau khi đặt hàng: /order/:code?phone=... — hiện mã VietQR nếu chuyển khoản và tự cập nhật khi đã nhận tiền. */
export default function OrderPage() {
  const { code = '' } = useParams();
  const [params] = useSearchParams();
  const phone = params.get('phone') || '';
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const startedAt = useRef(Date.now());
  const lastStatus = useRef<string | null>(null);
  const lastClaim = useRef<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  /** Cửa hàng đã kiểm tra và báo chưa thấy tiền về */
  const [claimRejected, setClaimRejected] = useState(false);

  const load = useCallback(
    async (silent: boolean) => {
      try {
        const data = await orderService.getPayment(code, phone, silent);
        if (lastStatus.current && lastStatus.current !== 'paid' && data.payment_status === 'paid') toast.success('Đã nhận được thanh toán. Cảm ơn bạn!');
        lastStatus.current = data.payment_status;
        if (lastClaim.current && !data.payment_claimed_at && data.payment_status !== 'paid') {
          setClaimRejected(true);
          toast.error('Cửa hàng chưa nhận được tiền. Vui lòng kiểm tra lại giao dịch.', { duration: 6000 });
        }
        lastClaim.current = data.payment_claimed_at;
        setInfo(data);
      } catch (error) {
        if (errorStatus(error) === 404) setNotFound(true);
      }
    },
    [code, phone]
  );

  useEffect(() => {
    document.title = `Đơn hàng ${code} - Shoppc`;
    window.scrollTo({ top: 0 });
    load(false);
  }, [code, load]);

  // Chờ chuyển khoản: tự hỏi lại trạng thái khi cửa hàng bật tự xác nhận, hoặc khi khách đã báo "đã chuyển khoản"
  const unpaidBanking = !!info && info.payment_method === 'banking' && info.payment_status !== 'paid' && info.status !== 'cancelled';
  const claimed = unpaidBanking && !!info?.payment_claimed_at;
  const pollMs = !unpaidBanking ? 0 : info?.auto_confirm ? POLL_MS : claimed ? POLL_CLAIMED_MS : 0;
  useEffect(() => {
    if (!pollMs) return undefined;
    const t = window.setInterval(() => {
      if (Date.now() - startedAt.current > POLL_MAX_MS) window.clearInterval(t);
      else if (document.visibilityState === 'visible') load(true);
    }, pollMs);
    return () => window.clearInterval(t);
  }, [pollMs, load]);

  const claim = async () => {
    setClaiming(true);
    try {
      const { message, data } = await orderService.claimPayment(code, phone);
      lastClaim.current = data.payment_claimed_at;
      lastStatus.current = data.payment_status;
      startedAt.current = Date.now();
      setClaimRejected(false);
      setInfo(data);
      toast.success(message);
    } catch {
      // api.ts đã hiện thông báo lỗi
    } finally {
      setClaiming(false);
    }
  };

  if (notFound) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <ExclamationTriangleIcon className="mx-auto mb-4 h-14 w-14 text-amber-500" />
        <h1 className="text-2xl font-bold text-gray-900">Không tìm thấy đơn hàng</h1>
        <p className="mt-2 text-gray-600">Liên kết không đúng hoặc thiếu số điện thoại đặt hàng.</p>
        <Link to="/" className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">Về trang chủ</Link>
      </div>
    );
  }

  if (!info) return <div className="container mx-auto px-4 py-16 text-center text-gray-500">Đang tải đơn hàng…</div>;

  const paid = info.payment_status === 'paid';
  const banking = info.payment_method === 'banking';

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm border border-gray-100">
          <CheckCircleIcon className="mx-auto h-14 w-14 text-green-600" />
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Đặt hàng thành công!</h1>
          <p className="mt-1 text-gray-600">
            Mã đơn hàng:{' '}
            <button type="button" onClick={() => copy(info.order_code, 'mã đơn')} className="font-mono font-semibold text-blue-600 hover:underline">
              {info.order_code}
            </button>
          </p>
          <p className="mt-1 text-sm text-gray-500">Hãy lưu mã đơn và số điện thoại đặt hàng để tra cứu khi cần.</p>
        </div>

        {info.status === 'cancelled' ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">Đơn hàng này đã bị hủy.</div>
        ) : banking ? (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="mb-4 flex items-center gap-2">
              <BanknotesIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Thanh toán chuyển khoản</h2>
            </div>

            {paid ? (
              <div className="flex items-center gap-3 rounded-xl bg-green-50 p-5 text-green-700">
                <CheckCircleIcon className="h-8 w-8 shrink-0" />
                <div>
                  <p className="font-semibold">Đã nhận thanh toán {formatPrice(info.total_amount)}</p>
                  <p className="text-sm">Cửa hàng sẽ sớm chuẩn bị và giao hàng cho bạn.</p>
                </div>
              </div>
            ) : info.bank ? (
              <div className="grid gap-6 md:grid-cols-[280px_1fr] md:items-start">
                <div className="text-center">
                  {info.qr_data_url && (
                    <img src={info.qr_data_url} alt={`Mã VietQR thanh toán đơn ${info.order_code}`} className="mx-auto w-64 rounded-xl border border-gray-200 bg-white p-2" />
                  )}
                  <p className="mt-2 text-sm text-gray-600">Mở app ngân hàng → <b>Quét mã QR</b>. Số tiền và nội dung đã điền sẵn.</p>
                </div>
                <div>
                  <Row label="Ngân hàng" value={info.bank.bank_name} />
                  <Row label="Số tài khoản" value={info.bank.account_no} copyValue={info.bank.account_no} />
                  <Row label="Chủ tài khoản" value={info.bank.account_name} />
                  <Row label="Số tiền" value={formatPrice(info.total_amount)} copyValue={String(info.total_amount)} strong />
                  <Row label="Nội dung" value={info.transfer_content} copyValue={info.transfer_content} />
                  <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                    Nếu chuyển khoản thủ công, hãy ghi <b>đúng nội dung {info.transfer_content}</b> và đúng số tiền để đơn được xác nhận.
                  </p>
                  {claimed ? (
                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800" aria-live="polite">
                      <p className="flex items-center gap-2 font-semibold">
                        <ClockIcon className="h-5 w-5 shrink-0" />
                        Đã báo cửa hàng lúc {new Date(info.payment_claimed_at as string).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {new Date(info.payment_claimed_at as string).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="mt-1 flex items-center gap-2">
                        <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        Đang chờ cửa hàng kiểm tra tài khoản… trang tự cập nhật khi xác nhận xong.
                      </p>
                    </div>
                  ) : (
                    <>
                      {claimRejected && (
                        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
                          Cửa hàng <b>chưa nhận được tiền</b> cho đơn này. Hãy kiểm tra lại giao dịch (số tiền, nội dung {info.transfer_content}) rồi báo lại, hoặc gọi cửa hàng để được hỗ trợ.
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={claim}
                        disabled={claiming}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-wait disabled:opacity-60"
                      >
                        <PaperAirplaneIcon className="h-5 w-5" />
                        {claiming ? 'Đang gửi…' : 'Tôi đã chuyển khoản'}
                      </button>
                      <p className="mt-2 text-center text-xs text-gray-500">
                        {info.auto_confirm
                          ? 'Đơn thường tự xác nhận trong vài giây sau khi tiền về. Bấm nút nếu đã chuyển mà trang chưa cập nhật.'
                          : 'Chuyển khoản xong thì bấm nút để cửa hàng kiểm tra và xác nhận ngay.'}
                      </p>
                      {info.auto_confirm && (
                        <p className="mt-3 flex items-center gap-2 text-sm text-gray-600" aria-live="polite">
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                          Đang chờ thanh toán… trang tự cập nhật khi cửa hàng nhận được tiền.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-700">Nhân viên sẽ liên hệ với bạn qua số điện thoại đặt hàng để gửi thông tin chuyển khoản. Số tiền cần thanh toán: <b>{formatPrice(info.total_amount)}</b>.</p>
            )}
          </div>
        ) : (
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <TruckIcon className="h-8 w-8 shrink-0 text-blue-600" />
            <div>
              <p className="font-semibold text-gray-900">Thanh toán khi nhận hàng (COD)</p>
              <p className="text-sm text-gray-600">Bạn trả {formatPrice(info.total_amount)} cho nhân viên giao hàng. Cửa hàng sẽ gọi xác nhận trước khi giao.</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to={`/account/orders/${encodeURIComponent(info.order_code)}`} className="rounded-lg border border-blue-600 bg-white px-6 py-3 font-semibold text-blue-600 hover:bg-blue-50">Theo dõi đơn hàng</Link>
          <Link to="/products" className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">Tiếp tục mua sắm</Link>
          <Link to="/" className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50">Về trang chủ</Link>
        </div>
      </div>
    </div>
  );
}
