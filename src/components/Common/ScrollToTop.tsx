import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Sang trang mới (bấm liên kết) thì lên đầu trang — trước đây bấm sản phẩm ở cuối trang chủ thì trang chi tiết
 * mở ra ở giữa. Bấm Quay lại / Tiến (POP) thì cuộn về đúng chỗ đã lướt tới ở trang đó; liên kết có #mục thì để trang tự cuộn tới.
 *
 * Tự nhớ vị trí theo từng mục lịch sử (location.key) thay vì để trình duyệt tự giữ: trang tải dữ liệu xong mới đủ cao,
 * lúc trình duyệt khôi phục thì trang còn ngắn nên luôn bị đẩy lên đầu.
 */
const STORAGE_KEY = 'shoppc_scroll_positions';
const RESTORE_TIMEOUT_MS = 4000;

const loadPositions = (): Record<string, number> => {
  try {
    const saved: Record<string, number> = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
    // 'default' = mục lịch sử đầu tiên khi mở trang (chưa có khóa riêng): bỏ vị trí của lần mở trước để không cuộn nhầm
    delete saved.default;
    return saved;
  } catch {
    return {};
  }
};

export default function ScrollToTop() {
  const { pathname, hash, key } = useLocation();
  const type = useNavigationType();
  const positions = useRef<Record<string, number>>(loadPositions());
  const currentKey = useRef(key);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const save = () => {
      positions.current[currentKey.current] = window.scrollY;
    };
    const persist = () => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions.current));
      } catch {
        /* chế độ ẩn danh / hết dung lượng: chỉ mất tính năng nhớ vị trí */
      }
    };
    window.addEventListener('scroll', save, { passive: true });
    // Ghi thêm ngay trước khi rời trang (bấm liên kết, bấm Quay lại): không phụ thuộc sự kiện cuộn đã kịp chạy chưa
    document.addEventListener('click', save, true);
    window.addEventListener('popstate', save, true);
    window.addEventListener('pagehide', persist);
    return () => {
      window.removeEventListener('scroll', save);
      document.removeEventListener('click', save, true);
      window.removeEventListener('popstate', save, true);
      window.removeEventListener('pagehide', persist);
      persist();
    };
  }, []);

  // useLayoutEffect: đổi khóa trước khi trình duyệt phát sự kiện cuộn của trang mới, để vị trí trang cũ không bị ghi đè
  useLayoutEffect(() => {
    currentKey.current = key;
    const samePage = prevPathname.current === pathname;
    prevPathname.current = pathname;
    if (hash) return;

    const target = type === 'POP' ? positions.current[key] : undefined;
    if (!target) {
      // Chỉ đổi ?tham số trên cùng trang (tab, trang của danh sách đơn…) thì giữ nguyên vị trí như trước
      if (type !== 'POP' && samePage) return;
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      return;
    }

    // Trang có thể còn đang tải dữ liệu: giữ đúng vị trí mỗi khung hình trong vài giây (dữ liệu/ảnh hiện ra sau làm trang
    // cao lên, trình duyệt sẽ tự dời chỗ cuộn để giữ chân trang trong tầm nhìn). Người dùng tự cuộn thì thôi.
    // setTimeout thay vì requestAnimationFrame: rAF dừng hẳn khi tab đang ẩn
    let timer = 0;
    const started = performance.now();
    const cancel = () => window.clearTimeout(timer);
    const hold = () => {
      const maxY = document.documentElement.scrollHeight - window.innerHeight;
      const top = Math.min(target, Math.max(0, maxY));
      if (Math.abs(window.scrollY - top) > 1) window.scrollTo({ top, left: 0, behavior: 'instant' as ScrollBehavior });
      if (performance.now() - started < RESTORE_TIMEOUT_MS) timer = window.setTimeout(hold, 16);
    };
    hold();
    const userEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
    userEvents.forEach((e) => window.addEventListener(e, cancel, { once: true, passive: true }));
    return () => {
      cancel();
      userEvents.forEach((e) => window.removeEventListener(e, cancel));
    };
  }, [pathname, hash, key, type]);

  return null;
}
