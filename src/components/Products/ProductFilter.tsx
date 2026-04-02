import React from 'react';
import { Category } from '../../types';

interface ProductFilterProps {
  categories: Category[];
  selectedCategory: number | null;
  selectedType: string | null;
  onCategoryChange: (categoryId: number | null) => void;
  onTypeChange: (type: string | null) => void;
}

const ProductFilter: React.FC<ProductFilterProps> = ({
  categories,
  selectedCategory,
  selectedType,
  onCategoryChange,
  onTypeChange,
}) => {
  const productTypes = [
    { value: 'pc', label: 'Máy tính', icon: '💻' },
    { value: 'component', label: 'Linh kiện', icon: '🔧' },
    { value: 'peripheral', label: 'Phụ kiện', icon: '🎮' },
  ];

  // Lọc danh mục theo loại sản phẩm
  const filteredCategories = selectedType
    ? categories.filter(cat => cat.type === selectedType && cat.parent_id === null)
    : categories.filter(cat => cat.parent_id === null);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold mb-4">Bộ lọc sản phẩm</h3>

      {/* Loại sản phẩm */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3 text-gray-700">Loại sản phẩm</h4>
        <div className="space-y-2">
          <button
            onClick={() => {
              onTypeChange(null);
              onCategoryChange(null);
            }}
            className={`w-full text-left px-3 py-2 rounded transition ${
              !selectedType
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            📦 Tất cả
          </button>
          {productTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => {
                onTypeChange(type.value);
                onCategoryChange(null);
              }}
              className={`w-full text-left px-3 py-2 rounded transition ${
                selectedType === type.value
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Danh mục */}
      {filteredCategories.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold mb-3 text-gray-700">Danh mục</h4>
          <div className="space-y-2">
            <button
              onClick={() => onCategoryChange(null)}
              className={`w-full text-left px-3 py-2 rounded transition ${
                !selectedCategory
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              📑 Tất cả danh mục
            </button>
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`w-full text-left px-3 py-2 rounded transition ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                📁 {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reset filter */}
      {(selectedType || selectedCategory) && (
        <button
          onClick={() => {
            onTypeChange(null);
            onCategoryChange(null);
          }}
          className="w-full mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
};

export default ProductFilter;