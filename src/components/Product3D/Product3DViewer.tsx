import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  CubeTransparentIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
  PauseIcon,
  PlayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Product } from '../../types';
import type { ModelViewerElement } from '../../types/model-viewer';
import { formatPrice } from '../../utils/formatters';

const START_ORBIT = '-30deg 75deg auto';

const isMobile = () => typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

interface Props {
  product: Product;
  onClose: () => void;
  /** Mở từ mã QR (?view=3d&ar=1): làm nổi bật nút AR */
  preferAr?: boolean;
}

type Phase = 'loading' | 'ready' | 'error';

/**
 * Trình xem mô hình 3D + AR bằng Google <model-viewer> (giống trang sản phẩm IKEA):
 *  - kéo để xoay, cuộn / chụm hai ngón để phóng to, tự xoay, hiện kích thước thật đọc từ file GLB;
 *  - "Xem trong không gian của bạn": Android (WebXR, Scene Viewer) và iPhone/iPad (AR Quick Look,
 *    dùng file USDZ nếu có, không thì model-viewer tự chuyển từ GLB) — đặt sản phẩm đúng tỉ lệ thật;
 *  - máy tính: hiện mã QR để mở ngay trang này trên điện thoại.
 * Chỉ dùng cho sản phẩm có model_3d.glb_url (xem has3d).
 */
const Product3DViewer: React.FC<Props> = ({ product, onClose, preferAr = false }) => {
  const model = product.model_3d || {};
  const [phase, setPhase] = useState<Phase>('loading');
  const [libReady, setLibReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showDims, setShowDims] = useState(false);
  const [arReady, setArReady] = useState<boolean | null>(null);
  const [qr, setQr] = useState('');
  const [dims, setDims] = useState<{ cx: number; cy: number; cz: number; x: number; y: number; z: number } | null>(null);
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const productUrl = `${window.location.origin}/products/${product.id}?view=3d&ar=1`;

  // Nạp thư viện model-viewer khi mở trình xem (trang sản phẩm không nặng thêm)
  useEffect(() => {
    let alive = true;
    import('@google/model-viewer')
      .then(() => alive && setLibReady(true))
      .catch((err) => {
        console.error('model-viewer:', err);
        if (alive) setPhase('error');
      });
    return () => {
      alive = false;
    };
  }, []);

  // Sự kiện của model-viewer (React 18 không tự gắn sự kiện cho web component)
  useEffect(() => {
    const mv = viewerRef.current;
    if (!mv || !libReady) return undefined;
    const onLoad = () => {
      setPhase('ready');
      setArReady(!!mv.canActivateAR);
      try {
        const size = mv.getDimensions();
        const c = mv.getBoundingBoxCenter();
        setDims({ cx: c.x, cy: c.y, cz: c.z, x: size.x, y: size.y, z: size.z });
      } catch {
        /* không đọc được kích thước: bỏ qua phần hiển thị kích thước */
      }
    };
    const onError = () => setPhase('error');
    const onProgress = (e: Event) => setProgress((e as CustomEvent<{ totalProgress: number }>).detail?.totalProgress ?? 0);
    mv.addEventListener('load', onLoad);
    mv.addEventListener('error', onError);
    mv.addEventListener('progress', onProgress);
    // File nằm sẵn trong bộ nhớ đệm có thể tải xong trước khi kịp gắn sự kiện
    if ((mv as unknown as { loaded?: boolean }).loaded) onLoad();
    return () => {
      mv.removeEventListener('load', onLoad);
      mv.removeEventListener('error', onError);
      mv.removeEventListener('progress', onProgress);
    };
  }, [libReady]);

  // Mã QR để mở trên điện thoại (chỉ tạo trên máy tính)
  useEffect(() => {
    if (isMobile()) return undefined;
    let alive = true;
    import('qrcode')
      .then((QR) => QR.toDataURL(productUrl, { margin: 1, width: 168, color: { dark: '#0b1426', light: '#ffffff' } }))
      .then((url) => alive && setQr(url))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [productUrl]);

  // Esc đóng; khóa cuộn trang phía sau; trả focus về chỗ cũ khi đóng
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [onClose]);

  const resetView = useCallback(() => {
    const mv = viewerRef.current;
    if (!mv) return;
    mv.cameraOrbit = START_ORBIT;
    mv.fieldOfView = 'auto';
    mv.resetTurntableRotation?.(0);
    mv.jumpCameraToGoal?.();
  }, []);

  const fullscreen = () => {
    const el = panelRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => undefined);
  };

  const startAr = () => {
    const mv = viewerRef.current;
    if (mv?.canActivateAR) void mv.activateAR();
  };

  const cm = (m: number) => `${(m * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} cm`;
  const dimLabel = 'pointer-events-none whitespace-nowrap rounded-md bg-blue-600 px-2 py-0.5 font-mono text-[11px] font-semibold text-white shadow';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Xem 3D: ${product.name}`}
      className="fixed inset-0 z-[100] flex animate-fade-in items-stretch justify-center bg-slate-950/70 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden bg-white sm:h-[min(88vh,760px)] sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-2xl lg:flex-row"
      >
        {/* Khung xem 3D */}
        <div className="relative min-h-0 flex-1 bg-gradient-to-b from-slate-50 to-slate-100">
          <div className="frost-grid-bg pointer-events-none absolute inset-0 opacity-60" />

          <div className="absolute left-3 right-3 top-3 z-10 flex items-start justify-between gap-3">
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white/85 px-3 py-2 backdrop-blur">
              <p className="frost-label !text-[10px] !text-blue-600">Xem 3D · AR</p>
              <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Đóng trình xem 3D"
              className="shrink-0 rounded-full border border-slate-200 bg-white/90 p-2 text-slate-700 shadow-sm backdrop-blur transition hover:text-blue-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {libReady && (
            <model-viewer
              ref={viewerRef as React.Ref<HTMLElement>}
              src={model.glb_url}
              {...(model.usdz_url ? { 'ios-src': model.usdz_url } : {})}
              {...(model.poster_url || product.image_url ? { poster: model.poster_url || product.image_url } : {})}
              alt={`Mô hình 3D của ${product.name}`}
              ar=""
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="fixed"
              ar-placement="floor"
              camera-controls=""
              touch-action="pan-y"
              camera-orbit={START_ORBIT}
              interaction-prompt="auto"
              shadow-intensity="1"
              shadow-softness="0.8"
              exposure="1"
              environment-image="neutral"
              {...(autoRotate ? { 'auto-rotate': '', 'auto-rotate-delay': '800', 'rotation-per-second': '18deg' } : {})}
              style={{ width: '100%', height: '100%' }}
            >
              {/* Ẩn nút AR và thanh tiến trình mặc định: dùng giao diện riêng */}
              <span slot="ar-button" style={{ display: 'none' }} />
              <span slot="progress-bar" style={{ display: 'none' }} />
              {showDims && dims && (
                <>
                  <span slot="hotspot-width" data-position={`${dims.cx} ${dims.cy - dims.y / 2} ${dims.cz + dims.z / 2}`} data-normal="0 -1 0" className={dimLabel}>
                    Rộng {cm(dims.x)}
                  </span>
                  <span slot="hotspot-height" data-position={`${dims.cx + dims.x / 2} ${dims.cy} ${dims.cz + dims.z / 2}`} data-normal="1 0 0" className={dimLabel}>
                    Cao {cm(dims.y)}
                  </span>
                  <span slot="hotspot-depth" data-position={`${dims.cx + dims.x / 2} ${dims.cy - dims.y / 2} ${dims.cz}`} data-normal="1 0 0" className={dimLabel}>
                    Sâu {cm(dims.z)}
                  </span>
                </>
              )}
            </model-viewer>
          )}

          {phase === 'loading' && (
            <div className="pointer-events-none absolute inset-x-0 bottom-16 flex flex-col items-center gap-2 text-slate-500">
              <div className="h-1.5 w-48 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${Math.max(5, Math.round(progress * 100))}%` }} />
              </div>
              <p className="text-xs">Đang tải mô hình 3D… {Math.round(progress * 100)}%</p>
            </div>
          )}
          {phase === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/90 px-6 text-center text-slate-600">
              <ExclamationTriangleIcon className="h-10 w-10 text-amber-500" />
              <p className="font-semibold">Không tải được mô hình 3D</p>
              <p className="max-w-sm text-sm text-slate-500">Kiểm tra kết nối mạng hoặc thử lại sau. Bạn vẫn xem được ảnh sản phẩm ở trang chi tiết.</p>
            </div>
          )}

          {/* Thanh công cụ */}
          {phase === 'ready' && (
            <div className="absolute bottom-3 left-1/2 z-10 flex w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 flex-wrap items-center justify-center gap-2">
              <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur">
                <ToolButton label={autoRotate ? 'Dừng xoay' : 'Tự xoay'} onClick={() => setAutoRotate((v) => !v)} pressed={autoRotate}>
                  {autoRotate ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                </ToolButton>
                {dims && (
                  <ToolButton label="Kích thước" onClick={() => setShowDims((v) => !v)} pressed={showDims}>
                    <CubeTransparentIcon className="h-4 w-4" />
                  </ToolButton>
                )}
                <ToolButton label="Góc ban đầu" onClick={resetView}>
                  <ArrowPathIcon className="h-4 w-4" />
                </ToolButton>
                <ToolButton label="Toàn màn hình" onClick={fullscreen} className="hidden sm:inline-flex">
                  <ArrowsPointingOutIcon className="h-4 w-4" />
                </ToolButton>
              </div>
              {arReady && (
                <button type="button" onClick={startAr} className={`frost-btn rounded-full !py-2.5 ${preferAr ? 'animate-pulse ring-4 ring-blue-500/30' : ''}`}>
                  <DevicePhoneMobileIcon className="h-4 w-4" />
                  Xem trong không gian của bạn
                </button>
              )}
            </div>
          )}
        </div>

        {/* Thông tin + AR trên điện thoại (màn hình lớn) */}
        <aside className="hidden w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l border-slate-200 bg-white p-5 lg:flex">
          <div className="flex items-center gap-3">
            {product.image_url && <img src={product.image_url} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-1" />}
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-semibold text-slate-900">{product.name}</p>
              <p className="text-sm font-bold text-blue-600">{formatPrice(Number(product.price))}</p>
            </div>
          </div>

          {dims && (
            <div>
              <p className="frost-label mb-2">Kích thước</p>
              <dl className="grid grid-cols-3 gap-2 text-center">
                {(
                  [
                    ['Rộng', dims.x],
                    ['Cao', dims.y],
                    ['Sâu', dims.z],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2">
                    <dt className="text-[11px] text-slate-500">{k}</dt>
                    <dd className="font-mono text-sm font-semibold text-slate-900">{cm(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <DevicePhoneMobileIcon className="h-5 w-5 text-blue-600" />
              Xem trong không gian của bạn
            </p>
            {arReady ? (
              <p className="mt-1 text-xs text-slate-600">Thiết bị hỗ trợ AR. Bấm nút bên dưới khung xem để đặt sản phẩm lên bàn làm việc của bạn.</p>
            ) : (
              <>
                <p className="mt-1 text-xs text-slate-600">
                  Quét mã bằng camera điện thoại (Android có ARCore hoặc iPhone/iPad) để đặt sản phẩm đúng kích thước lên bàn của bạn.
                </p>
                {qr ? (
                  <img src={qr} alt="Mã QR mở trình xem AR trên điện thoại" className="mx-auto mt-3 h-40 w-40 rounded-lg border border-slate-200 bg-white p-1" />
                ) : (
                  <div className="mx-auto mt-3 h-40 w-40 animate-pulse rounded-lg bg-slate-200" />
                )}
              </>
            )}
          </div>

          <ul className="space-y-1.5 text-xs text-slate-500">
            <li>• Kéo để xoay · cuộn chuột / chụm hai ngón để phóng to</li>
            <li>• Nhấp đúp vào một điểm để lấy nét</li>
            <li>• Màu sắc hiển thị có thể khác thực tế đôi chút do ánh sáng màn hình.</li>
          </ul>
        </aside>

        <div className="border-t border-slate-200 bg-white px-4 py-2 text-center text-[11px] text-slate-500 lg:hidden">
          {arReady === false && isMobile() ? 'Thiết bị này chưa hỗ trợ AR — bạn vẫn xoay, phóng to mô hình 3D được.' : 'Kéo để xoay · chụm hai ngón để phóng to'}
        </div>
      </div>
    </div>,
    document.body
  );
};

const ToolButton: React.FC<{ label: string; onClick: () => void; pressed?: boolean; className?: string; children: React.ReactNode }> = ({
  label,
  onClick,
  pressed,
  className = '',
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    aria-pressed={pressed}
    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
      pressed ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
    } ${className}`}
  >
    {children}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export default Product3DViewer;
