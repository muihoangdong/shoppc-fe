import React, { useEffect, useRef, useState } from 'react';
import { useCart } from '../hooks/useCart';
import { formatPrice } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orderService } from '../services/orderService';
import { couponService, CouponCheck } from '../services/couponService';
import { errorMessage, errorStatus } from '../services/api';

interface CheckoutForm {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  note: string;
  paymentMethod: 'cod' | 'banking';
}

const CheckoutPage: React.FC = () => {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CheckoutForm>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    note: '',
    paymentMethod: 'cod',
  });
  // Mã giảm giá: số tiền giảm do server tính; đơn hàng vẫn được kiểm tra lại lúc đặt
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<CouponCheck | null>(null);
  const [couponError, setCouponError] = useState('');
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const applyCoupon = async (code: string, quiet = false) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setCouponError('Nhập mã giảm giá');
      return;
    }
    setCheckingCoupon(true);
    setCouponError('');
    try {
      const result = await couponService.check(trimmed, { phone: formData.phone, email: formData.email });
      setCoupon(result);
      setCouponInput(result.code);
      if (!quiet) toast.success(`Đã áp dụng mã ${result.code}`);
    } catch (error) {
      setCoupon(null);
      setCouponError(errorMessage(error, 'Không kiểm tra được mã, vui lòng thử lại'));
    } finally {
      setCheckingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError('');
    setCouponInput('');
  };

  // Giỏ hàng đổi (thêm/bớt sản phẩm ở tab khác) -> tính lại mã đang dùng
  const cartTotalRef = useRef(cart.total);
  useEffect(() => {
    if (cartTotalRef.current === cart.total) return;
    cartTotalRef.current = cart.total;
    if (coupon) void applyCoupon(coupon.code, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.total]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address || !formData.city) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);

    try {
      const order = await orderService.createOrder({
        customer_name: formData.fullName,
        customer_email: formData.email,
        customer_phone: formData.phone,
        customer_address: formData.address,
        customer_city: formData.city,
        note: formData.note,
        payment_method: formData.paymentMethod,
        coupon_code: coupon?.code,
      });
      toast.success(`Đặt hàng thành công! Mã đơn: ${order.order_code}`);
      // Sang trang đơn hàng trước (có mã QR nếu chọn chuyển khoản), rồi mới xóa giỏ để trang này không tự chuyển về giỏ hàng
      navigate(`/order/${encodeURIComponent(order.order_code)}?phone=${encodeURIComponent(formData.phone.trim())}`, { replace: true });
      await clearCart();
    } catch (error) {
      console.error(error);
      // Mã hết lượt / khách đã dùng... trong lúc đang điền form: kiểm tra lại để hiện lý do ngay dưới ô mã
      if (coupon && errorStatus(error) === 400) void applyCoupon(coupon.code, true);
    } finally {
      setLoading(false);
    }
  };

  if (cart.items.length === 0) {
    navigate('/cart');
    return null;
  }

  const shippingFee = coupon ? coupon.shipping_fee : cart.total >= 5000000 ? 0 : 30000;
  const discount = coupon ? coupon.discount : 0;
  const totalAmount = coupon ? coupon.total_amount : cart.total + shippingFee;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Thanh toán</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Checkout Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Thông tin giao hàng</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thành phố <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phương thức thanh toán
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                <option value="banking">Chuyển khoản ngân hàng (quét mã VietQR)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ghi chú về giao hàng..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Đặt hàng'}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        {/* Điện thoại: hiện đơn hàng + ô mã giảm giá trước form để khách thấy tổng tiền trước khi bấm Đặt hàng */}
        <div className="bg-white rounded-lg shadow-md p-6 h-fit order-first lg:order-none lg:sticky lg:top-24">
          <h2 className="text-xl font-bold mb-4">Đơn hàng của bạn</h2>
          
          <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 pb-4">
            <label htmlFor="coupon-code" className="block text-sm font-medium text-gray-700 mb-1">
              Mã giảm giá
            </label>
            {coupon ? (
              <div className="flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm">
                <div>
                  <p className="font-mono font-semibold text-green-800">{coupon.code}</p>
                  <p className="text-green-700">{coupon.description || coupon.summary}</p>
                </div>
                <button type="button" onClick={removeCoupon} className="shrink-0 text-sm font-medium text-gray-600 hover:text-red-600">
                  Bỏ mã
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    id="coupon-code"
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      setCouponError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void applyCoupon(couponInput);
                      }
                    }}
                    maxLength={30}
                    autoComplete="off"
                    placeholder="Nhập mã nếu có"
                    aria-invalid={!!couponError}
                    aria-describedby="coupon-error"
                    className={`min-w-0 flex-1 px-3 py-2 border rounded-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 ${couponError ? 'border-red-400' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => void applyCoupon(couponInput)}
                    disabled={checkingCoupon}
                    className="shrink-0 px-4 py-2 rounded-lg border border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 disabled:opacity-50"
                  >
                    {checkingCoupon ? 'Đang kiểm tra…' : 'Áp dụng'}
                  </button>
                </div>
                {couponError && (
                  <p id="coupon-error" role="alert" className="mt-1 text-sm text-red-600">
                    {couponError}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Tạm tính:</span>
              <span>{formatPrice(cart.total)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Giảm giá ({coupon?.code}):</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Phí vận chuyển:</span>
              <span>{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Tổng cộng:</span>
                <span className="text-red-600">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>

          {shippingFee === 0 && (
            <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-lg text-sm">
              🎉 Bạn được miễn phí vận chuyển cho đơn hàng này!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;