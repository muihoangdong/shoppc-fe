import React, { useId } from 'react';

interface LogoProps {
  /** "light": chữ trắng (đặt trên nền màu/tối như header, footer). "default": chữ đậm theo giao diện sáng/tối. */
  variant?: 'light' | 'default';
  /** Chỉ hiện biểu tượng, không hiện chữ */
  markOnly?: boolean;
  className?: string;
}

/** Biểu tượng Shoppc: màn hình máy tính có tia sét trên nền indigo (cùng hình với public/favicon.svg). */
export const LogoMark: React.FC<{ className?: string }> = ({ className = 'h-10 w-10' }) => {
  const id = useId();
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill={`url(#${id})`} />
      <rect x="12" y="14" width="40" height="27" rx="4" fill="#fff" />
      <path d="M34.5 18.5 25 30.5h6l-2 7.5 10-12.5h-6.2l1.7-7z" fill="#f59e0b" />
      <path d="M32 41v7M23 49.5h18" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
};

const Logo: React.FC<LogoProps> = ({ variant = 'default', markOnly = false, className = '' }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <LogoMark
      className={`h-10 w-10 shrink-0 rounded-[14px] drop-shadow-sm ${variant === 'light' ? 'ring-2 ring-white/70' : ''}`}
    />
    {!markOnly && (
      <span
        className={`text-2xl font-extrabold tracking-wide leading-none ${
          variant === 'light' ? 'text-white' : 'text-gray-900'
        }`}
      >
        SHOP<span className={variant === 'light' ? 'text-amber-300' : 'text-blue-600'}>PC</span>
      </span>
    )}
    <span className="sr-only">Shoppc - Trang chủ</span>
  </span>
);

export default Logo;