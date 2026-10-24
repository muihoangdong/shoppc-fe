import React, { useId } from 'react';

interface LogoProps {
  /** "light": chữ trắng (đặt trên nền màu/tối). "default": chữ đậm theo giao diện sáng/tối. */
  variant?: 'light' | 'default';
  /** Chỉ hiện biểu tượng, không hiện chữ */
  markOnly?: boolean;
  /** Ẩn dòng chữ phụ "STARFORGE FROST" */
  compact?: boolean;
  className?: string;
}

/** Biểu tượng Shoppc "Starforge Frost": tinh thể băng 4 cánh trên nền xanh băng (cùng hình với public/favicon.svg). */
export const LogoMark: React.FC<{ className?: string }> = ({ className = 'h-10 w-10' }) => {
  const id = useId();
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1aa3f5" />
          <stop offset="1" stopColor="#1e40af" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill={`url(#${id})`} />
      <path d="M32 12 36 28 52 32 36 36 32 52 28 36 12 32 28 28Z" fill="#fff" />
      <path d="M45 15 41.5 24.5 49 19M19 45l3.5-9.5L15 41" stroke="#bfe6ff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="32" cy="32" r="3.2" fill="#1aa3f5" />
    </svg>
  );
};

const Logo: React.FC<LogoProps> = ({ variant = 'default', markOnly = false, compact = false, className = '' }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <LogoMark className="h-9 w-9 shrink-0 rounded-[12px] shadow-sm" />
    {!markOnly && (
      <span className="flex flex-col leading-none">
        <span className={`text-xl font-extrabold tracking-tight ${variant === 'light' ? 'text-white' : 'text-slate-900'}`}>
          SHOP<span className={variant === 'light' ? 'text-sky-300' : 'text-blue-600'}>PC</span>
        </span>
        {!compact && (
          <span className={`mt-1 flex items-center gap-1 font-mono text-[9px] font-semibold tracking-[0.2em] ${variant === 'light' ? 'text-white/70' : 'text-blue-600'}`}>
            STARFORGE FROST
            <span className="h-1 w-1 rounded-full bg-current" />
          </span>
        )}
      </span>
    )}
    <span className="sr-only">Shoppc - Trang chủ</span>
  </span>
);

export default Logo;
