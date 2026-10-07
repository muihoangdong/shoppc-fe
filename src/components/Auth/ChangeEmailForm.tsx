import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { authService } from '../../services/authService';
import OtpInput from './OtpInput';
import DevOtpNotice from './DevOtpNotice';
import type { RegisterOtpInfo } from '../../types';

interface ChangeEmailFormProps {
  currentEmail: string;
  onDone: () => void | Promise<void>;
  onCancel: () => void;
}

const inputClass =
  'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

/** Đổi email: nhập email mới + mật khẩu hiện tại -> nhận mã ở email mới -> nhập mã. */
export default function ChangeEmailForm({ currentEmail, onDone, onCancel }: ChangeEmailFormProps) {
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<RegisterOtpInfo | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [expiresAt, setExpiresAt] = useState(0);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!info) return undefined;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [info]);

  const expiresIn = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const resendIn = Math.max(0, Math.ceil((resendAt - now) / 1000));

  const apply = (next: RegisterOtpInfo) => {
    const t = Date.now();
    setInfo(next);
    setExpiresAt(t + next.expires_in * 1000);
    setResendAt(t + next.resend_in * 1000);
    setNow(t);
    setCode('');
    setCodeError(false);
  };

  const sendCode = async () => {
    const value = newEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return toast.error('Vui lòng nhập email mới hợp lệ');
    if (value.toLowerCase() === currentEmail.toLowerCase()) return toast.error('Email mới trùng với email hiện tại');
    if (!password) return toast.error('Vui lòng nhập mật khẩu hiện tại');
    try {
      setBusy(true);
      const next = await authService.requestEmailChange(value, password);
      apply(next);
      setPassword('');
      toast.success(next.dev_code ? 'Đã tạo mã xác nhận' : `Đã gửi mã xác nhận tới ${next.masked_email}`);
    } catch (error) {
      console.error('Request email change error:', error);
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  const verify = async (value: string = code) => {
    if (!info || busy || value.length !== 6) return;
    try {
      setBusy(true);
      await authService.verifyEmailChange(info.email, value);
      toast.success('Đổi email thành công');
      await onDone();
    } catch (error) {
      setCodeError(true);
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!info || busy || resendIn > 0) return;
    try {
      setBusy(true);
      const next = await authService.resendEmailChange(info.email);
      apply(next);
      toast.success(next.dev_code ? 'Đã tạo mã xác nhận mới' : `Đã gửi mã mới tới ${next.masked_email}`);
    } catch (error) {
      console.error('Resend email change error:', error);
    } finally {
      setBusy(false);
    }
  };

  if (info) {
    return (
      <div className="space-y-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Xác nhận email mới</h2>
        <p className="text-sm text-gray-600">
          Nhập mã 6 số đã gửi tới <span className="font-semibold text-gray-900">{info.email}</span>.{!info.dev_code && ' Không thấy email? Hãy kiểm tra mục Spam.'}
        </p>
        <DevOtpNotice code={info.dev_code} onUse={(c) => { setCode(c); setCodeError(false); verify(c); }} />
        <OtpInput
          value={code}
          onChange={(v) => { setCode(v); setCodeError(false); }}
          onComplete={(v) => verify(v)}
          disabled={busy || expiresIn === 0}
          hasError={codeError}
        />
        <p className={`text-center text-sm ${expiresIn > 0 ? 'text-gray-600' : 'text-red-600 font-medium'}`} aria-live="polite">
          {expiresIn > 0 ? <>Mã hết hạn sau <span className="font-semibold tabular-nums">{mmss(expiresIn)}</span></> : 'Mã đã hết hạn. Vui lòng gửi lại mã.'}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => verify()}
            disabled={busy || code.length !== 6 || expiresIn === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {busy ? 'Đang xử lý...' : 'Xác nhận đổi email'}
          </button>
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Hủy</button>
          <span className="text-sm text-gray-600">
            {resendIn > 0 ? (
              <>Gửi lại mã sau <span className="tabular-nums">{resendIn}s</span></>
            ) : (
              <button type="button" onClick={resend} disabled={busy} className="text-blue-600 hover:underline font-medium">Gửi lại mã</button>
            )}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      <h2 className="text-lg font-semibold text-gray-800">Đổi email</h2>
      <p className="text-sm text-gray-600">
        Email hiện tại: <span className="font-medium text-gray-900">{currentEmail}</span>. Chúng tôi sẽ gửi mã xác nhận tới email mới.
      </p>
      <div>
        <label htmlFor="new-email" className="block text-sm font-medium text-gray-700 mb-1">Email mới <span className="text-red-500">*</span></label>
        <input id="new-email" type="email" autoComplete="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label htmlFor="confirm-current-password" className="block text-sm font-medium text-gray-700 mb-1">
          Mật khẩu hiện tại <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="confirm-current-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={sendCode} disabled={busy} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
          {busy ? 'Đang gửi mã...' : 'Gửi mã xác nhận'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Hủy</button>
      </div>
    </div>
  );
}
