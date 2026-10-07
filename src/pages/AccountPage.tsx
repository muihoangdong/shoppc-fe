import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/formatters';
import { PencilIcon, KeyIcon, EnvelopeIcon, ClipboardDocumentListIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import ChangeEmailForm from '../components/Auth/ChangeEmailForm';
import { useState } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { roleBadgeClass, roleLabel } from '../utils/roles';

export default function AccountPage() {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [editingData, setEditingData] = useState({
    full_name: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleEditClick = () => {
    if (user) {
      setEditingData({
        full_name: user.full_name,
        email: user.email
      });
      setIsEditing(true);
    }
  };

  const handleUpdate = async () => {
    if (!editingData.full_name.trim()) {
      toast.error('Vui lòng nhập họ tên');
      return;
    }
    
    setLoading(true);
    try {
      // Email đổi riêng ở mục "Đổi email" (cần mã xác nhận gửi tới email mới)
      await authService.updateMe({
        full_name: editingData.full_name
      });
      await refreshUser();
      toast.success('Cập nhật thông tin thành công');
      setIsEditing(false);
    } catch {
      // Thông báo lỗi đã được hiện trong services/api.ts (trước đây bị hiện 2 lần)
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // Validate
    if (!passwordData.current_password) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    
    if (!passwordData.new_password) {
      toast.error('Vui lòng nhập mật khẩu mới');
      return;
    }
    
    if (passwordData.new_password.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    
    setLoading(true);
    try {
      await authService.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      toast.success('Đổi mật khẩu thành công');
      setIsChangingPassword(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch {
      // Thông báo lỗi đã được hiện trong services/api.ts (trước đây bị hiện 2 lần)
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md p-8 mt-10 text-center">
        <p className="text-gray-500">Vui lòng đăng nhập để xem thông tin tài khoản</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md p-6 sm:p-8 mt-10">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tài khoản của bạn</h1>
        <div className="flex flex-wrap gap-3">
          {!isEditing && !isChangingPassword && !isChangingEmail && (
            <>
              <button
                onClick={() => setIsChangingEmail(true)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
              >
                <EnvelopeIcon className="h-4 w-4" />
                <span className="text-sm">Đổi email</span>
              </button>
              <button
                onClick={() => setIsChangingPassword(true)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
              >
                <KeyIcon className="h-4 w-4" />
                <span className="text-sm">Đổi mật khẩu</span>
              </button>
              <button
                onClick={handleEditClick}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition"
              >
                <PencilIcon className="h-4 w-4" />
                <span className="text-sm">Chỉnh sửa</span>
              </button>
            </>
          )}
        </div>
      </div>

      <Link
        to="/account/orders"
        className="mb-6 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-900 transition hover:bg-blue-100"
      >
        <ClipboardDocumentListIcon className="h-8 w-8 shrink-0 text-blue-600" />
        <span className="flex-1">
          <span className="block font-semibold">Đơn hàng của tôi</span>
          <span className="block text-sm text-blue-800/80">Theo dõi đơn đang giao, xem lại lịch sử mua hàng, mua lại, đánh giá sản phẩm</span>
        </span>
        <ChevronRightIcon className="h-5 w-5 shrink-0" />
      </Link>

      {/* Edit Profile Form */}
      {isEditing && (
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Chỉnh sửa thông tin</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editingData.full_name}
              onChange={(e) => setEditingData({ ...editingData, full_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Đổi email: xác nhận bằng mã gửi tới email mới */}
      {isChangingEmail && (
        <ChangeEmailForm
          currentEmail={user.email}
          onCancel={() => setIsChangingEmail(false)}
          onDone={async () => {
            await refreshUser();
            setIsChangingEmail(false);
          }}
        />
      )}

      {/* Change Password Form */}
      {isChangingPassword && (
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Đổi mật khẩu</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu hiện tại <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showCurrentPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Mật khẩu phải có ít nhất 6 ký tự</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Xác nhận mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleChangePassword}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </button>
            <button
              onClick={() => {
                setIsChangingPassword(false);
                setPasswordData({
                  current_password: '',
                  new_password: '',
                  confirm_password: ''
                });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* User Info Display */}
      {!isEditing && !isChangingPassword && !isChangingEmail && (
        <div className="space-y-4 text-gray-700">
          <div className="pb-4 border-b">
            <p className="text-sm text-gray-500 mb-1">Họ tên</p>
            <p className="font-medium text-lg">{user.full_name || '-'}</p>
          </div>
          <div className="pb-4 border-b">
            <p className="text-sm text-gray-500 mb-1">Tên đăng nhập</p>
            <p className="font-medium text-lg">{user.username}</p>
          </div>
          <div className="pb-4 border-b">
            <p className="text-sm text-gray-500 mb-1">Email</p>
            <p className="font-medium text-lg">{user.email}</p>
          </div>
          <div className="pb-4 border-b">
            <p className="text-sm text-gray-500 mb-1">Vai trò</p>
            <p className="font-medium text-lg">
              <span className={`px-2 py-1 text-xs rounded-full ${roleBadgeClass(user.role)}`}>
                {roleLabel(user.role)}
              </span>
            </p>
          </div>
          <div className="pb-4 border-b">
            <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
            <p className="font-medium text-lg">
              <span className={`px-2 py-1 text-xs rounded-full ${
                user.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
              </span>
            </p>
          </div>
          <div className="pb-4 border-b">
            <p className="text-sm text-gray-500 mb-1">Ngày tạo</p>
            <p className="font-medium text-lg">
              {user.created_at ? formatDate(user.created_at) : '-'}
            </p>
          </div>
          {user.last_login && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Đăng nhập gần nhất</p>
              <p className="font-medium text-lg">{formatDate(user.last_login)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}