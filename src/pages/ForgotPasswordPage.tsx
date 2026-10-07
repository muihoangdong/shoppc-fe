import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { authService } from '../services/authService';
import { LogoMark } from '../components/Common/Logo';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

/** Quên mật khẩu: nhập email -> server gửi liên kết đặt lại mật khẩu (hiệu lực 30 phút). */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error('Vui lòng nhập email hợp lệ');
      return;
    }
    try {
      setSubmitting(true);
      await authService.forgotPassword(value);
      setSentTo(value);
    } catch (error) {
      console.error('Forgot password error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <Link to="/login" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600">
          <ArrowLeftIcon className="h-4 w-4" /> Quay lại đăng nhập
        </Link>

        {sentTo ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100">
              <EnvelopeIcon className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Kiểm tra email của bạn</h1>
            <p className="text-gray-600 mt-3">
              Nếu <span className="font-semibold text-gray-900">{sentTo}</span> là email của một tài khoản Shoppc, bạn sẽ nhận được
              liên kết đặt lại mật khẩu trong vài phút. Liên kết có hiệu lực <b>30 phút</b>.
            </p>
            <p className="text-xs text-gray-500 mt-3">Không thấy email? Hãy kiểm tra mục Spam / Quảng cáo.</p>
            <button
              type="button"
              onClick={() => setSentTo(null)}
              className="mt-6 text-sm font-medium text-blue-600 hover:underline"
            >
              Gửi lại / dùng email khác
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <Link to="/" aria-label="Về trang chủ Shoppc" className="inline-block mb-4">
                <LogoMark className="h-16 w-16 rounded-[14px] drop-shadow-md" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Quên mật khẩu</h1>
              <p className="text-gray-600 mt-2">Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết để đặt mật khẩu mới.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="example@email.com"
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Đang gửi...' : 'Gửi liên kết đặt lại mật khẩu'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
