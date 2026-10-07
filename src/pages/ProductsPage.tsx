import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { Product, Category } from '../types';
import ProductCard from '../components/Products/ProductCard';
import ProductFilter from '../components/Products/ProductFilter';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { PRODUCT_GRID } from '../utils/layout';

const ProductsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const latest = useRef(0);
  // ?category=<id> (từ "Xem thêm" ở mục Sản phẩm tương tự) chọn sẵn danh mục
  const [selectedCategory, setSelectedCategory] = useState<number | null>(() => Number(searchParams.get('category')) || null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const typeParam = searchParams.get('type');
  const searchParam = searchParams.get('search');

  useEffect(() => {
    const ticket = ++latest.current; // bỏ qua kết quả cũ nếu người dùng đã đổi bộ lọc tiếp
    const fetchData = async () => {
      setRefreshing(true);
      try {
        const [allCategories, productList] = await Promise.all([
          categoryService.getAllCategories(),
          productService.getProducts({
            type: selectedType || typeParam || undefined,
            category_id: selectedCategory || undefined,
            search: searchParam || undefined
          })
        ]);
        
        if (ticket !== latest.current) return;
        setCategories(allCategories);
        setProducts(productList);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        if (ticket === latest.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    fetchData();
  }, [selectedCategory, selectedType, typeParam, searchParam]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-1/4">
          <ProductFilter
            categories={categories}
            selectedCategory={selectedCategory}
            selectedType={selectedType}
            onCategoryChange={setSelectedCategory}
            onTypeChange={setSelectedType}
          />
        </div>

        {/* Products Grid */}
        <div className="lg:w-3/4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Sản phẩm</h1>
            <p className="text-gray-600">Tìm thấy {products.length} sản phẩm</p>
          </div>
          
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
            </div>
          ) : (
            <div className={`${PRODUCT_GRID.replace('lg:grid-cols-4', 'xl:grid-cols-4')} transition-opacity duration-200 ${refreshing ? 'opacity-60' : ''}`} aria-busy={refreshing}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;