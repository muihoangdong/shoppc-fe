import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { LogoMark } from '../components/Common/Logo';
import DevOtpNotice from '../components/Auth/DevOtpNotice';
import OtpInput from '../components/Auth/OtpInput';
import type { RegisterOtpInfo } from '../types';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

/** 125 giây -> "2:05" */
const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

const Spinner = ({ label }: { label: string }) => (
  <div className="flex items-center justify-center gap-2">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
    {label}
  </div>
);

export default function RegisterPage() {
  const { register, verifyRegistration, resendRegistrationOtp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',      // Tên đăng nhập
    full_name: '',     // Họ tên đầy đủ
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Bước 2: nhập mã OTP đã gửi tới email
  const [otpInfo, setOtpInfo] = useState<RegisterOtpInfo | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [expiresAt, setExpiresAt] = useState(0);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!otpInfo) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [otpInfo]);

  const expiresIn = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const resendIn = Math.max(0, Math.ceil((resendAt - now) / 1000));

  const applyOtpInfo = (info: RegisterOtpInfo) => {
    const t = Date.now();
    setOtpInfo(info);
    setExpiresAt(t + info.expires_in * 1000);
    setResendAt(t + info.resend_in * 1000);
    setNow(t);
    setCode('');
    setCodeError(false);
    window.scrollTo({ top: 0 });
  };

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validate form
    if (!form.username.trim()) {
      toast.error('Vui lòng nhập tên đăng nhập');
      return;
    }

    if (!form.full_name.trim()) {
      toast.error('Vui lòng nhập họ tên');
      return;
    }

    if (!form.email.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }

    if (!form.password) {
      toast.error('Vui lòng nhập mật khẩu');
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (form.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setSubmitting(true);
      const info = await register({
        username: form.username.trim(),
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password
      });
      applyOtpInfo(info);
      toast.success(info.dev_code ? 'Đã tạo mã xác nhận' : `Đã gửi mã xác nhận tới ${info.masked_email}`);
    } catch (error) {
      // Lỗi (trùng tên đăng nhập/email, gửi mail thất bại...) đã được hiện thông báo trong api.ts
      console.error('Register error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (value: string = code) => {
    if (!otpInfo || verifying) return;
    if (value.length !== 6) {
      toast.error('Vui lòng nhập đủ 6 chữ số');
      return;
    }
    try {
      setVerifying(true);
      await verifyRegistration(otpInfo.email, value);
      navigate('/', { replace: true });
    } catch (error) {
      setCodeError(true);
      setCode('');
      console.error('Verify error:', error);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!otpInfo || resending || resendIn > 0) return;
    try {
      setResending(true);
      const info = await resendRegistrationOtp(otpInfo.email);
      applyOtpInfo(info);
      toast.success(info.dev_code ? 'Đã tạo mã xác nhận mới' : `Đã gửi mã mới tới ${info.masked_email}`);
    } catch (error) {
      console.error('Resend error:', error);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {otpInfo ? (
          /* ───────── Bước 2: nhập mã OTP ───────── */
          <div>
            <button
              type="button"
              onClick={() => setOtpInfo(null)}
              className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
            >
              <ArrowLeftIcon className="h-4 w-4" /> Sửa thông tin đăng ký
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
                <EnvelopeIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Xác nhận email</h1>
              <p className="text-gray-600 mt-2">
                {otpInfo.dev_code ? "Nhập mã 6 số để xác nhận email" : "Nhập mã 6 số đã gửi tới"}
                <br />
                <span className="font-semibold text-gray-900">{otpInfo.email}</span>
              </p>
              {!otpInfo.dev_code && <p className="text-xs text-gray-500 mt-2">Không thấy email? Hãy kiểm tra mục Spam / Quảng cáo.</p>}
            </div>

            <DevOtpNotice code={otpInfo.dev_code} onUse={(c) => { setCode(c); setCodeError(false); handleVerify(c); }} />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify();
              }}
              className="space-y-5"
            >
              <OtpInput
                value={code}
                onChange={(v) => {
                  setCode(v);
                  setCodeError(false);
                }}
                onComplete={(v) => handleVerify(v)}
                disabled={verifying || expiresIn === 0}
                hasError={codeError}
              />

              <p className={`text-center text-sm ${expiresIn > 0 ? 'text-gray-600' : 'text-red-600 font-medium'}`} aria-live="polite">
                {expiresIn > 0 ? (
                  <>Mã hết hạn sau <span className="font-semibold tabular-nums">{mmss(expiresIn)}</span></>
                ) : (
                  'Mã đã hết hạn. Vui lòng gửi lại mã mới.'
                )}
              </p>

              <button
                type="submit"
                disabled={verifying || code.length !== 6 || expiresIn === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {verifying ? <Spinner label="Đang xác nhận..." /> : 'Xác nhận và tạo tài khoản'}
              </button>
            </form>

            <p className="text-sm text-gray-600 mt-6 text-center">
              Chưa nhận được mã?{' '}
              {resendIn > 0 ? (
                <span className="text-gray-500">Gửi lại sau <span className="tabular-nums">{resendIn}s</span></span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-blue-600 hover:underline font-medium disabled:opacity-60"
                >
                  {resending ? 'Đang gửi...' : 'Gửi lại mã'}
                </button>
              )}
            </p>
          </div>
        ) : (
          /* ───────── Bước 1: thông tin đăng ký ───────── */
          <>
            <div className="text-center mb-8">
              <Link to="/" aria-label="Về trang chủ Shoppc" className="inline-block mb-4">
                <LogoMark className="h-16 w-16 rounded-[14px] drop-shadow-md" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản</h1>
              <p className="text-gray-600 mt-2">
                Tạo tài khoản để lưu giỏ hàng và thanh toán nhanh hơn
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Họ tên */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Nhập họ và tên"
                  className={inputClass}
                />
              </div>

              {/* Tên đăng nhập */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="Nhập tên đăng nhập"
                  className={inputClass}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="example@email.com"
                  className={inputClass}
                />
                <p className="text-xs text-gray-500 mt-1">Chúng tôi sẽ gửi mã xác nhận tới email này.</p>
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="••••••"
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Mật khẩu phải có ít nhất 6 ký tự</p>
              </div>

              {/* Xác nhận mật khẩu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="••••••"
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? <Spinner label="Đang gửi mã xác nhận..." /> : 'Đăng ký'}
              </button>
            </form>

            <p className="text-sm text-gray-600 mt-6 text-center">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Đăng nhập
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
