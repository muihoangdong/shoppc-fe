import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CubeIcon, MagnifyingGlassPlusIcon, PhotoIcon } from '@heroicons/react/24/outline';
import ImageLightbox from './ImageLightbox';

interface Props {
  images: string[];
  name: string;
  badge?: React.ReactNode;
  onOpen3d?: () => void;
}

const ProductGallery: React.FC<Props> = ({ images, name, badge, onOpen3d }) => {
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const thumbs = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const index = Math.min(active, Math.max(0, images.length - 1));
  const closeZoom = useCallback(() => setZoomOpen(false), []);
  const navigate = (delta: number) => setActive((current) => (current + delta + images.length) % images.length);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    thumbs.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
  }, [index]);

  return (
    <section aria-label={`Thư viện ảnh ${name}`} className="min-w-0"
      onKeyDown={(e) => {
        if (zoomOpen || images.length < 2) return;
        if (e.key === 'ArrowLeft') { e.preventDefault(); navigate(-1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); navigate(1); }
      }}>
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white"
        onTouchStart={(e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchCancel={() => { touch.current = null; }}
        onTouchEnd={(e) => {
          if (touch.current && images.length > 1) {
            const dx = e.changedTouches[0].clientX - touch.current.x;
            const dy = e.changedTouches[0].clientY - touch.current.y;
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) navigate(dx < 0 ? 1 : -1);
          }
          touch.current = null;
        }}>
        <button type="button" disabled={!images.length} onClick={() => setZoomOpen(true)} aria-label="Phóng to ảnh sản phẩm"
          className="group flex h-80 w-full items-center justify-center p-6 sm:h-[26rem] sm:p-10">
          {images.length ? <ProductPhoto key={images[index]} src={images[index]} alt={`${name} — ảnh ${index + 1}`} /> : (
            <span className="flex flex-col items-center gap-2 text-slate-400"><PhotoIcon className="h-20 w-20" />Chưa có ảnh sản phẩm</span>
          )}
        </button>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">{badge}</div>
        {images.length > 1 && <>
          <button type="button" onClick={() => navigate(-1)} aria-label="Ảnh trước" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white shadow transition hover:bg-black/60 sm:left-3"><ChevronLeftIcon className="h-6 w-6" /></button>
          <button type="button" onClick={() => navigate(1)} aria-label="Ảnh tiếp theo" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white shadow transition hover:bg-black/60 sm:right-3"><ChevronRightIcon className="h-6 w-6" /></button>
        </>}
        {images.length > 0 && <span aria-live="polite" aria-atomic="true" className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold text-white">{index + 1}/{images.length}</span>}
        {onOpen3d ? (
          <button type="button" onClick={onOpen3d} className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm hover:text-blue-700"><CubeIcon className="h-4 w-4 text-blue-600" />Xem 3D</button>
        ) : images.length > 0 && <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-600"><MagnifyingGlassPlusIcon className="h-3.5 w-3.5" />Bấm để phóng to</span>}
      </div>

      {(images.length > 0 || onOpen3d) && (
        <div className="relative mt-3 px-5">
          <button type="button" aria-label="Cuộn ảnh thu nhỏ sang trái" onClick={() => thumbs.current?.scrollBy({ left: -240, behavior: 'smooth' })} className="absolute -left-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-1 text-slate-600 shadow"><ChevronLeftIcon className="h-4 w-4" /></button>
          <div ref={thumbs} className="flex gap-2 overflow-x-auto py-1" style={{ scrollbarWidth: 'thin' }}>
            {images.map((url, i) => (
              <button key={url} data-index={i} type="button" onClick={() => setActive(i)} aria-label={`Xem ảnh ${i + 1}`} aria-pressed={index === i}
                className={`flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 bg-white p-1 transition ${index === i ? 'border-slate-800' : 'border-slate-200 hover:border-blue-400'}`}>
                <img src={url} alt={`Ảnh thu nhỏ ${i + 1}`} loading="lazy" className="h-full w-full object-contain" />
              </button>
            ))}
            {onOpen3d && <button type="button" aria-label="Xem mô hình 3D" onClick={onOpen3d} className="flex h-[4.5rem] w-[4.5rem] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-blue-200 bg-blue-50 text-blue-600"><CubeIcon className="h-6 w-6" /><span className="text-xs font-semibold">3D · AR</span></button>}
          </div>
          <button type="button" aria-label="Cuộn ảnh thu nhỏ sang phải" onClick={() => thumbs.current?.scrollBy({ left: 240, behavior: 'smooth' })} className="absolute -right-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-1 text-slate-600 shadow"><ChevronRightIcon className="h-4 w-4" /></button>
        </div>
      )}
      {zoomOpen && images.length > 0 && <ImageLightbox src={images[index]} images={images} initialIndex={index} onImageChange={setActive} alt={name} onClose={closeZoom} />}
    </section>
  );
};

const ProductPhoto: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);
  return failed ? <span className="flex flex-col items-center gap-2 text-sm text-slate-400"><PhotoIcon className="h-14 w-14" />Không tải được ảnh này</span> : (
    <img src={src} alt={alt} draggable={false} onError={() => setFailed(true)} className="max-h-full max-w-full object-contain motion-safe:animate-fade-in" />
  );
};

export default ProductGallery;
