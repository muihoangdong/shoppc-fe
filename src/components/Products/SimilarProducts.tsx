import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { Product } from '../../types';
import { productService } from '../../services/productService';
import { PRODUCT_GRID } from '../../utils/layout';
import { pickSimilar, SIMILAR_LIMIT as LIMIT } from '../../utils/similar';
import ProductCard from './ProductCard';

const SkeletonCard = () => (
  <div className="overflow-hidden rounded-xl bg-white shadow-md" aria-hidden="true">
    <div className="aspect-[4/3] animate-pulse bg-gray-200" />
    <div className="space-y-2 p-4">
      <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
      <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200" />
    </div>
  </div>
);

const SimilarProducts: React.FC<{ product: Product }> = ({ product }) => {
  const [items, setItems] = useState<Product[] | null>(null);

  useEffect(() => {
    let alive = true;
    setItems(null);
    Promise.all([
      product.category_id ? productService.getProductsByCategory(product.category_id).catch(() => []) : Promise.resolve([]),
      product.category_type ? productService.getProductsByType(product.category_type).catch(() => []) : Promise.resolve([]),
    ]).then(([byCategory, byType]) => {
      if (alive) setItems(pickSimilar(product, byCategory, byType));
    });
    return () => {
      alive = false;
    };
  }, [product]);

  if (items && items.length === 0) return null;

  return (
    <section className="mt-10" aria-labelledby="similar-title">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 id="similar-title" className="text-xl font-bold text-gray-900 sm:text-2xl">Sản phẩm tương tự</h2>
        {product.category_id && (
          <Link to={`/products?category=${product.category_id}`} className="flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
            Xem thêm <ArrowRightIcon className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className={PRODUCT_GRID}>
        {items ? items.map((p) => <ProductCard key={p.id} product={p} />) : Array.from({ length: LIMIT }, (_, i) => <SkeletonCard key={i} />)}
      </div>
    </section>
  );
};

export default SimilarProducts;
