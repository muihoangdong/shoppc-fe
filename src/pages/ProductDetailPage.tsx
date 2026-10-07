import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { productService } from '../services/productService';
import { Product } from '../types';
import ProductDetail from '../components/Products/ProductDetail';
import ProductReviews from '../components/Products/ProductReviews';
import SimilarProducts from '../components/Products/SimilarProducts';
import ErrorMessage from '../components/Common/ErrorMessage';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

/** Khung chờ có cùng bố cục với trang thật: không bị "nhảy" khi dữ liệu về */
const DetailSkeleton = () => (
  <div className="grid grid-cols-1 gap-8 rounded-lg bg-white p-6 shadow-lg md:grid-cols-2" aria-busy="true" aria-label="Đang tải sản phẩm">
    <div className="h-80 animate-pulse rounded-lg bg-gray-200 sm:h-96" />
    <div className="space-y-4">
      <div className="h-8 w-3/4 animate-pulse rounded bg-gray-200" />
      <div className="h-6 w-24 animate-pulse rounded-full bg-gray-200" />
      <div className="h-9 w-40 animate-pulse rounded bg-gray-200" />
      <div className="h-24 animate-pulse rounded bg-gray-200" />
      <div className="h-12 animate-pulse rounded-lg bg-gray-200" />
    </div>
  </div>
);

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    const ticket = ++latest.current; // bấm nhanh sang sản phẩm khác: bỏ kết quả của lần trước
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getProductById(parseInt(id, 10));
      if (ticket !== latest.current) return;
      setProduct(data);
      document.title = `${data.name} - Shoppc`;
    } catch (err) {
      if (ticket !== latest.current) return;
      setError('Không thể tải thông tin sản phẩm');
      console.error(err);
    } finally {
      if (ticket === latest.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchProduct();
  }, [fetchProduct]);

  // "Quay lại": về trang trước nếu khách đi từ trong web vào, còn mở thẳng link thì về danh sách sản phẩm
  const goBack = () => {
    if (location.key !== 'default' && window.history.length > 1) navigate(-1);
    else navigate('/products');
  };

  // Đang chuyển sang sản phẩm khác (bấm ở mục "Sản phẩm tương tự"): giữ nội dung cũ mờ đi thay vì xóa trắng trang
  const switching = loading && !!product && String(product.id) !== id;

  return (
    <div className="container mx-auto px-4 py-8">
      <button onClick={goBack} className="mb-6 flex items-center gap-2 text-gray-600 transition hover:text-blue-600">
        <ArrowLeftIcon className="h-5 w-5" />
        Quay lại
      </button>

      {error ? (
        <ErrorMessage message={error} onRetry={() => void fetchProduct()} />
      ) : !product ? (
        <DetailSkeleton />
      ) : (
        <div className={`transition-opacity duration-200 ${switching ? 'pointer-events-none opacity-50' : 'opacity-100'}`}>
          {/* key: sang sản phẩm khác thì số lượng, trạng thái nút… bắt đầu lại từ đầu */}
          <ProductDetail key={product.id} product={product} />
          <ProductReviews productId={product.id} />
          <SimilarProducts product={product} />
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
