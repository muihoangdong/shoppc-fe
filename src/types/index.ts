// src/types/index.ts

// ==================== CATEGORY ====================
export interface Category {
  id: number;
  name: string;
  type: 'pc' | 'component' | 'peripheral';
  parent_id: number | null;
  sub_categories?: Category[];
  created_at: string;
  updated_at: string;
}

// ==================== PRODUCT ====================
export interface ProductSpecs {
  [key: string]: string | number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: number;
  category_name?: string;
  category_type?: string;
  image_url?: string;
  specs: ProductSpecs;
  created_at: string;
  updated_at: string;
}

// ==================== CART ====================
export interface CartItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  stock: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  total_items: number;
}

export interface StockValidationItem {
  product_id: number;
  quantity: number;
  stock: number;
  name: string;
}

export interface StockValidationResult {
  valid: boolean;
  outOfStock: StockValidationItem[];
}

// ==================== API RESPONSE ====================
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

// ==================== USER & AUTH ====================
export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  avatar?: string;
  role: 'admin' | 'staff';
  status: 'active' | 'inactive';
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  email: string;
  full_name: string;
}

export interface UpdateMePayload {
  full_name?: string;
  email?: string;
  avatar?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// ==================== ORDER ====================
export interface Order {
  id: number;
  order_code: string;
  user_id?: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_ward?: string;
  customer_district?: string;
  customer_city?: string;
  note?: string;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total_amount: number;
  payment_method: 'cod' | 'banking' | 'momo' | 'zalopay' | 'vnpay';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  tracking_number?: string;
  admin_note?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
  total: number;
}

// ==================== COUPON ====================
export interface Coupon {
  id: number;
  code: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_value: number;
  max_discount?: number;
  usage_limit: number;
  used_count: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// ==================== REVIEW ====================
export interface Review {
  id: number;
  product_id: number;
  user_id?: number;
  customer_name: string;
  rating: number;
  comment: string;
  images?: string[];
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

// ==================== DASHBOARD STATS ====================
export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockProducts: number;
  pendingOrders: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  topProducts: Array<{ name: string; sales: number; revenue: number }>;
}