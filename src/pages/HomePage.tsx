import { useEffect, useState } from 'react';
import { productService } from '../services/productService';
import { Product } from '../types';
import ProductCard from '../components/Products/ProductCard';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { PRODUCT_GRID } from '../utils/layout';
import { Link } from 'react-router-dom';
import { CpuChipIcon, ComputerDesktopIcon, PuzzlePieceIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

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
      <section className="container mx-auto px-4 pt-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-800 via-blue-600 to-sky-500 px-6 py-10 text-white shadow-lg sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full border-[28px] border-white/10" />
          <div className="pointer-events-none absolute bottom-0 right-24 h-40 w-40 rounded-full bg-sky-300/20 blur-2xl" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-mono text-[11px] font-semibold tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-green-300" /> STARFORGE FROST · PHẦN CỨNG CHÍNH HÃNG
          </span>
          <h1 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">Linh kiện PC & máy bộ hiệu năng cao</h1>
          <p className="mt-3 max-w-xl text-white/80">CPU, VGA, mainboard, RAM, SSD… chính hãng, xem mô hình 3D và đặt thử trong không gian của bạn bằng AR trước khi mua.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/products" className="rounded-lg bg-white px-5 py-2.5 font-mono text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50">
              Mua sắm ngay
            </Link>
            <Link to="/build-pc" className="rounded-lg border border-white/40 px-5 py-2.5 font-mono text-sm font-semibold text-white hover:bg-white/10">
              Xây dựng PC →
            </Link>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { to: '/products?type=component', title: 'Linh kiện PC', text: 'CPU · VGA · RAM · SSD', icon: CpuChipIcon },
            { to: '/products?type=pc', title: 'Máy tính nguyên bộ', text: 'Gaming · Đồ họa · Văn phòng', icon: ComputerDesktopIcon },
            { to: '/products?type=peripheral', title: 'Phụ kiện', text: 'Bàn phím · Chuột · Tai nghe', icon: PuzzlePieceIcon },
            { to: '/build-pc', title: 'Build PC', text: 'Kiểm tra tương thích', icon: WrenchScrewdriverIcon },
          ].map(({ to, title, text, icon: Icon }) => (
            <Link key={to} to={to} className="frost-card group flex items-center gap-3 p-4 transition hover:border-blue-300">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-900">{title}</span>
                <span className="block truncate font-mono text-[10px] text-slate-500">{text}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

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