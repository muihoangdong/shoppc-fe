import React from 'react';

interface LogoProps {
  /** "light": chữ trắng (đặt trên nền màu/tối). "default": chữ đậm theo giao diện sáng/tối. */
  variant?: 'light' | 'default';
  /** Chỉ hiện biểu tượng, không hiện chữ */
  markOnly?: boolean;
  className?: string;
}

export const LogoMark: React.FC<{ className?: string }> = ({ className = 'h-10 w-10' }) => (
  <img src={`${import.meta.env.BASE_URL}favicon.svg?v=teal`} alt="" className={className} />
);

const Logo: React.FC<LogoProps> = ({ variant = 'default', markOnly = false, className = '' }) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <LogoMark className="h-9 w-9 shrink-0" />
    {markOnly ? (
      <span className="sr-only">Shoppc</span>
    ) : (
      <span className={`text-base font-extrabold leading-none tracking-[0.1em] sm:text-lg ${variant === 'light' ? 'text-white' : 'text-primary-600'}`}>
        SHOPPC
      </span>
    )}
  </span>
);

export default Logo;
