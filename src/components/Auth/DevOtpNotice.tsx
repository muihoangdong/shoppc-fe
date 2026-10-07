import { KeyIcon } from '@heroicons/react/24/outline';

/**
 * Hiện mã xác nhận ngay trên trang khi backend chưa cấu hình gửi email (SMTP_PASS trống, không phải production).
 * Điền SMTP trong shoppc-be/.env thì mã được gửi qua email và khung này tự ẩn.
 */
export default function DevOtpNotice({ code, onUse }: { code?: string; onUse: (code: string) => void }) {
  if (!code) return null;
  return (
    <div role="status" className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
      <p className="flex items-center gap-2 font-semibold">
        <KeyIcon className="h-5 w-5 shrink-0" /> Mã xác nhận của bạn
      </p>
      <div className="mt-2 flex items-center gap-3">
        <span className="rounded-lg bg-white px-3 py-1.5 font-mono text-xl font-bold tracking-[0.3em] text-blue-900 ring-1 ring-blue-200">{code}</span>
        <button type="button" onClick={() => onUse(code)} className="rounded-lg bg-blue-600 px-3 py-1.5 font-semibold text-white hover:bg-blue-700">
          Điền mã
        </button>
      </div>
    </div>
  );
}
