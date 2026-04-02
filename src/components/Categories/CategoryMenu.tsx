import React, { useEffect, useState } from 'react';
import { categoryService } from '../../services/categoryService';
import { Category } from '../../types';
import { Link } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const CategoryMenu: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [openMenus, setOpenMenus] = useState<number[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getAllCategories();
        // Chỉ lấy danh mục cha
        const parentCategories = data.filter(cat => !cat.parent_id);
        setCategories(parentCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const toggleMenu = (categoryId: number) => {
    setOpenMenus(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h3 className="text-lg font-bold mb-4 text-gray-800">Danh mục sản phẩm</h3>
      <ul className="space-y-2">
        {categories.map((category) => (
          <li key={category.id}>
            <div className="flex items-center justify-between">
              <Link
                to={`/products?category_id=${category.id}`}
                className="text-gray-700 hover:text-blue-600 transition flex-1 py-2"
              >
                {category.name}
              </Link>
              <button
                onClick={() => toggleMenu(category.id)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform ${
                    openMenus.includes(category.id) ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryMenu;