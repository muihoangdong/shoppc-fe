import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

const ZOOM = 2.5;

/**
 * Xem ảnh sản phẩm toàn màn hình. Bấm vào ảnh (hoặc nút kính lúp) để phóng to 2,5 lần đúng chỗ bấm,
 * rê chuột / kéo ngón tay để xem các phần khác. Esc, nút X hoặc bấm ra ngoài để đóng.
 */
const ImageLightbox: React.FC<ImageLightboxProps> = ({ src, alt, onClose }) => {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const frameRef = useRef<HTMLDivElement>(null); // khung không phóng to: đo vị trí chuột theo khung, không theo ảnh đã phóng
  const closeRef = useRef<HTMLButtonElement>(null);

  // Esc đóng; khóa cuộn trang phía sau; trả focus về chỗ cũ khi đóng
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [onClose]);

  const pointAt = (clientX: number, clientY: number) => {
    const r = frameRef.current?.getBoundingClientRect();
    if (!r) return;
    const clamp = (v: number) => Math.min(100, Math.max(0, v));
    setOrigin({ x: clamp(((clientX - r.left) / r.width) * 100), y: clamp(((clientY - r.top) / r.height) * 100) });
  };

  const toggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    pointAt(e.clientX, e.clientY);
    setZoomed((z) => !z);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Ảnh phóng to: ${alt}`}
      className="fixed inset-0 z-[100] flex animate-fade-in items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <div className="absolute right-3 top-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => {
            setOrigin({ x: 50, y: 50 });
            setZoomed((z) => !z);
          }}
          aria-label={zoomed ? 'Thu nhỏ' : 'Phóng to'}
          className="rounded-full bg-white/15 p-2 text-white backdrop-blur transition hover:bg-white/30"
        >
          {zoomed ? <MagnifyingGlassMinusIcon className="h-6 w-6" /> : <MagnifyingGlassPlusIcon className="h-6 w-6" />}
        </button>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Đóng" className="rounded-full bg-white/15 p-2 text-white backdrop-blur transition hover:bg-white/30">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <div ref={frameRef} className="max-h-full max-w-full overflow-hidden rounded-lg bg-white" onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt={alt}
          draggable={false}
          onClick={toggleZoom}
          onMouseMove={(e) => zoomed && pointAt(e.clientX, e.clientY)}
          onTouchMove={(e) => zoomed && pointAt(e.touches[0].clientX, e.touches[0].clientY)}
          style={{ transform: zoomed ? `scale(${ZOOM})` : 'scale(1)', transformOrigin: `${origin.x}% ${origin.y}%` }}
          className={`block max-h-[85vh] max-w-[92vw] select-none object-contain transition-transform duration-200 ease-out ${zoomed ? 'cursor-zoom-out touch-none' : 'cursor-zoom-in'}`}
        />
      </div>

      <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-center text-xs text-white">
        {zoomed ? 'Rê chuột / kéo để xem chi tiết · bấm để thu nhỏ' : 'Bấm vào ảnh để phóng to · bấm ✕ hoặc Esc để đóng'}
      </p>
    </div>,
    document.body
  );
};

export default ImageLightbox;
