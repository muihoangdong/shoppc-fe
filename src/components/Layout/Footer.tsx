import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, ClockIcon } from '@heroicons/react/24/outline';
import Logo from '../Common/Logo';

const COLUMNS: { title: string; links: { to: string; label: string }[] }[] = [
  {
    title: 'Phần cứng & Máy',
    links: [
      { to: '/products', label: 'Tất cả sản phẩm' },
      { to: '/products?type=pc', label: 'Máy tính PC' },
      { to: '/products?type=component', label: 'Linh kiện máy tính' },
      { to: '/products?type=peripheral', label: 'Phụ kiện & Gaming gear' },
    ],
  },
  {
    title: 'Dịch vụ & Hỗ trợ',
    links: [
      { to: '/build-pc', label: 'Công cụ Cấu hình PC' },
      { to: '/account/orders', label: 'Tra cứu đơn hàng' },
      { to: '/return', label: 'Chính sách đổi trả' },
      { to: '/account', label: 'Tài khoản của tôi' },
    ],
  },
];

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo compact className="mb-4" />
            <p className="text-sm leading-relaxed text-slate-500">
              Cửa hàng máy tính và linh kiện chính hãng. Tư vấn cấu hình, lắp ráp và bảo hành tận nơi với giá tốt nhất.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="frost-label mb-4 !text-slate-800">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-slate-500 transition-colors hover:text-blue-600">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="frost-label mb-4 !text-slate-800">Hệ thống Shoppc</h3>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li className="flex items-start gap-2">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <span>911 Đường Trần Duy Hưng, Quận 1, TP.HCM</span>
              </li>
              <li className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 shrink-0 text-blue-600" />
                <a href="tel:0354334944" className="hover:text-blue-600">
                  Hotline: 0354 334 944
                </a>
              </li>
              <li className="flex items-center gap-2">
                <EnvelopeIcon className="h-4 w-4 shrink-0 text-blue-600" />
                <a href="mailto:muihoangdong007lklk@gmail.com" className="min-w-0 break-all hover:text-blue-600">
                  muihoangdong007lklk@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 shrink-0 text-blue-600" />
                <span>8:00 – 20:00 (Thứ 2 – Chủ nhật)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-[11px] text-slate-500 md:flex-row">
          <p>© {currentYear} Shoppc Hardware Platform. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-5">
            <Link to="/terms" className="hover:text-blue-600">
              Điều khoản dịch vụ
            </Link>
            <Link to="/privacy" className="hover:text-blue-600">
              Bảo mật thông tin
            </Link>
            <Link to="/return" className="hover:text-blue-600">
              Chính sách đổi trả
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
