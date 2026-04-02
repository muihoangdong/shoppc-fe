import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { Product, Category } from '../types';
import ProductCard from '../components/Products/ProductCard';
import ProductFilter from '../components/Products/ProductFilter';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const ProductsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const typeParam = searchParams.get('type');
  const searchParam = searchParams.get('search');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allCategories, productList] = await Promise.all([
          categoryService.getAllCategories(),
          productService.getProducts({
            type: selectedType || typeParam || undefined,
            category_id: selectedCategory || undefined,
            search: searchParam || undefined
          })
        ]);
        
        setCategories(allCategories);
        setProducts(productList);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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