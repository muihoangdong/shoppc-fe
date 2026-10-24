import { Product } from '../../types';

/** Sản phẩm có mô hình 3D để xem không: phải có file GLB và không bị admin tạm tắt. */
export const has3d = (p: Pick<Product, 'model_3d'>): boolean => !!(p.model_3d?.glb_url && p.model_3d.enabled !== false);

/** Tải trước thư viện <model-viewer> (gọi khi rê chuột vào nút 3D để mở trình xem nhanh hơn). */
export const preloadModelViewer = (): void => {
  void import('@google/model-viewer');
};
