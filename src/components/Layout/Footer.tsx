import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-blue-400">SHOPPC</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Cửa hàng máy tính và linh kiện chính hãng hàng đầu Việt Nam.
              Chúng tôi cam kết mang đến sản phẩm chất lượng với giá tốt nhất.
            </p>
            <div className="mt-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <span className="text-blue-400">✓</span>
                <span>Hàng chính hãng 100%</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                <span className="text-blue-400">✓</span>
                <span>Bảo hành 12 tháng</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                <span className="text-blue-400">✓</span>
                <span>Giao hàng toàn quốc</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Liên kết nhanh</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-gray-400 hover:text-blue-400 transition-colors text-sm">
                  Tất cả sản phẩm
                </Link>
              </li>
              <li>
                <Link to="/products?type=pc" className="text-gray-400 hover:text-blue-400 transition-colors text-sm">
                  Máy tính PC
                </Link>
              </li>
              <li>
                <Link to="/products?type=component" className="text-gray-400 hover:text-blue-400 transition-colors text-sm">
                  Linh kiện máy tính
                </Link>
              </li>
              <li>
                <Link to="/products?type=peripheral" className="text-gray-400 hover:text-blue-400 transition-colors text-sm">
                  Phụ kiện
                </Link>
              </li>
              <li>
                <Link to="/account" className="text-gray-400 hover:text-blue-400 transition-colors text-sm">
                  Tài khoản của tôi
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Thông tin liên hệ</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-gray-400 text-sm">
                <span className="text-blue-400">📍</span>
                <span>911 Đường Trần Duy Hưng, Quận 1, TP.HCM</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <span className="text-blue-400">📞</span>
                <a href="tel:0354334944" className="hover:text-blue-400 transition-colors">
                  0354 334 944
                </a>
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <span className="text-blue-400">📧</span>
                <a href="mailto:shoppc36@gmail.com" className="hover:text-blue-400 transition-colors">
                  shoppc36@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <span className="text-blue-400">⏰</span>
                <span>8:00 - 20:00 (Thứ 2 - Chủ nhật)</span>
              </li>
            </ul>
          </div>

          {/* Newsletter & Social */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Theo dõi chúng tôi</h3>
            
            {/* Social Links */}
            <div className="flex gap-3 mb-6">
              <a 
                href="#" 
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4.5"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.51"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                aria-label="YouTube"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.5 6.2a3 3 0 0 0-2-2c-1.7-.5-8.6-.5-8.6-.5s-6.9 0-8.6.5a3 3 0 0 0-2 2c-.5 1.7-.5 5.3-.5 5.3s0 3.6.5 5.3a3 3 0 0 0 2 2c1.7.5 8.6.5 8.6.5s6.9 0 8.6-.5a3 3 0 0 0 2-2c.5-1.7.5-5.3.5-5.3s0-3.6-.5-5.3zM9.5 15.2V8.8l6 3.2-6 3.2z"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                aria-label="TikTok"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.6 8.3c-1.5 0-2.7-1.2-2.7-2.7V5h-3v10c0 1.7-1.4 3.1-3.1 3.1-1.7 0-3.1-1.4-3.1-3.1 0-1.7 1.4-3.1 3.1-3.1.2 0 .4 0 .6.1v-3c-2 0-3.6 1.6-3.6 3.6 0 2 1.6 3.6 3.6 3.6s3.6-1.6 3.6-3.6V7.8c.7.5 1.6.8 2.5.8v-3z"/>
                </svg>
              </a>
            </div>

            {/* Payment Methods */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-3">Phương thức thanh toán</h4>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-gray-800 rounded text-xs">COD</span>
                <span className="px-2 py-1 bg-gray-800 rounded text-xs">VNPay</span>
                <span className="px-2 py-1 bg-gray-800 rounded text-xs">Momo</span>
                <span className="px-2 py-1 bg-gray-800 rounded text-xs">ZaloPay</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              &copy; {currentYear} Shoppc. Cam kết mang đến trải nghiệm mua sắm tốt nhất.
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="/privacy" className="text-gray-400 hover:text-blue-400 transition-colors">
                Chính sách bảo mật
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-blue-400 transition-colors">
                Điều khoản sử dụng
              </Link>
              <Link to="/return" className="text-gray-400 hover:text-blue-400 transition-colors">
                Chính sách đổi trả
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;