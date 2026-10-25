import { useEffect, useState } from 'react';
import { productService } from '../services/productService';
import { Product } from '../types';
import ProductCard from '../components/Products/ProductCard';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { PRODUCT_GRID } from '../utils/layout';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [pcProducts, setPcProducts] = useState<Product[]>([]);
  const [componentProducts, setComponentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allProducts, pcList, componentList] = await Promise.all([
          productService.getProducts(),
          productService.getProductsByType('pc'),
          productService.getProductsByType('component'),
        ]);

        setFeaturedProducts(allProducts.slice(0, 8)); // 2 hàng × 4
        setPcProducts(pcList.slice(0, 4));
        setComponentProducts(componentList.slice(0, 4));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">Sản phẩm nổi bật</h2>
          <div className={PRODUCT_GRID}>
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">PC Gaming & Văn phòng</h2>
          <div className={PRODUCT_GRID}>
            {pcProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">Linh kiện máy tính</h2>
          <div className={PRODUCT_GRID}>
            {componentProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;