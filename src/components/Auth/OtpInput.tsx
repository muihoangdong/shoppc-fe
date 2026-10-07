import React, { useEffect, useRef } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Gọi khi đã nhập đủ số (để tự xác nhận) */
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  hasError?: boolean;
}

/**
 * Ô nhập mã OTP: mỗi ô một chữ số, tự nhảy sang ô kế tiếp, Backspace quay lại ô trước,
 * dán (Ctrl+V) cả mã một lần, trên điện thoại hiện bàn phím số và gợi ý mã từ tin nhắn/email.
 */
const OtpInput: React.FC<OtpInputProps> = ({ value, onChange, onComplete, length = 6, disabled, hasError }) => {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  // Lúc mở và mỗi khi mã bị xóa hết (nhập sai, gửi lại mã): đưa con trỏ về ô đầu tiên
  useEffect(() => {
    if (!value) refs.current[0]?.focus();
  }, [value]);

  const update = (next: string, focusIndex: number) => {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    refs.current[Math.min(focusIndex, length - 1)]?.focus();
    if (clean.length === length) onComplete?.(clean);
  };

  // Mã luôn là một chuỗi liền (không có ô trống ở giữa): gõ vào ô phía sau chỗ đang nhập thì điền vào ô trống đầu tiên
  const handleChange = (index: number, raw: string) => {
    let typed = raw.replace(/\D/g, '');
    if (!typed) return;
    // Ô đã có số mà gõ thêm (không bôi đen): giữ số vừa gõ, bỏ số cũ
    if (typed.length === 2 && digits[index]) typed = typed.replace(digits[index], '') || typed[1];
    const at = Math.min(index, value.length);
    if (typed.length > 1) {
      // Dán hoặc trình duyệt tự điền cả mã vào một ô
      update(value.slice(0, at) + typed, at + typed.length);
      return;
    }
    update(value.slice(0, at) + typed + value.slice(at + 1), at + 1);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (index < value.length) {
        onChange(value.slice(0, index) + value.slice(index + 1));
      } else if (value.length > 0) {
        onChange(value.slice(0, -1));
        refs.current[value.length - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;
    e.preventDefault();
    update(pasted, pasted.length);
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label="Mã xác nhận gồm 6 chữ số">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          pattern="[0-9]*"
          maxLength={length}
          value={d}
          disabled={disabled}
          aria-label={`Chữ số thứ ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={`h-12 w-10 sm:h-14 sm:w-12 rounded-lg border text-center text-xl sm:text-2xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 ${
            hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
          }`}
        />
      ))}
    </div>
  );
};

export default OtpInput;
