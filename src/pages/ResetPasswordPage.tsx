import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { authService } from '../services/authService';
import { LogoMark } from '../components/Common/Logo';
import { errorMessage, errorStatus } from '../services/api';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

/** Đặt mật khẩu mới từ liên kết trong email: /reset-password?token=... */
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [invalid, setInvalid] = useState(!token);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (password !== confirm) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    try {
      setSubmitting(true);
      await authService.resetPassword(token, password);
      setDone(true);
      toast.success('Đặt lại mật khẩu thành công');
    } catch (error) {
      // Liên kết sai / hết hạn / đã dùng: server trả 400
      if (errorStatus(error) === 400 && /liên kết/i.test(errorMessage(error, ''))) setInvalid(true);
    } finally {
      setSubmitting(false);
    }
  };

  const card = (children: React.ReactNode) => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">{children}</div>
    </div>
  );

  if (done) {
    return card(
      <div className="text-center">
        <CheckCircleIcon className="mx-auto mb-4 h-16 w-16 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-900">Đã đặt mật khẩu mới</h1>
        <p className="text-gray-600 mt-2">Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.</p>
        <button
          type="button"
          onClick={() => navigate('/login', { replace: true })}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  if (invalid) {
    return card(
      <div className="text-center">
        <ExclamationTriangleIcon className="mx-auto mb-4 h-16 w-16 text-amber-500" />
        <h1 className="text-2xl font-bold text-gray-900">Liên kết không còn hiệu lực</h1>
        <p className="text-gray-600 mt-2">
          Liên kết đặt lại mật khẩu không đúng, đã hết hạn (sau 30 phút) hoặc đã được dùng. Vui lòng yêu cầu liên kết mới.
        </p>
        <Link
          to="/forgot-password"
          className="mt-6 inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
        >
          Gửi lại liên kết
        </Link>
      </div>
    );
  }

  return card(
    <>
      <div className="text-center mb-8">
        <Link to="/" aria-label="Về trang chủ Shoppc" className="inline-block mb-4">
          <LogoMark className="h-16 w-16 rounded-[14px] drop-shadow-md" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Đặt mật khẩu mới</h1>
        <p className="text-gray-600 mt-2">Nhập mật khẩu mới cho tài khoản của bạn.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
          <div className="relative">
            <input
              id="new-password"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoFocus
              autoComplete="new-password"
              placeholder="Ít nhất 6 ký tự"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {show ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Nhập lại mật khẩu mới</label>
          <input
            id="confirm-password"
            type={show ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
        </button>
      </form>
    </>
  );
}
