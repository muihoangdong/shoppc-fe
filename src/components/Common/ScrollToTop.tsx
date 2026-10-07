import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Sang trang mới (bấm liên kết) thì lên đầu trang — trước đây bấm sản phẩm ở cuối trang chủ thì trang chi tiết
 * mở ra ở giữa. Bấm Quay lại / Tiến (POP) thì để trình duyệt tự giữ vị trí cũ; liên kết có #mục thì để trang tự cuộn tới.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const type = useNavigationType();
  useEffect(() => {
    if (type !== 'POP' && !hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash, type]);
  return null;
}
