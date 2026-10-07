import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import PolicyPage from './pages/PolicyPage';
import BuildPcPage from './pages/BuildPcPage';
import OrderPage from './pages/OrderPage';
import MyOrdersPage from './pages/MyOrdersPage';
import MyOrderDetailPage from './pages/MyOrderDetailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import ScrollToTop from './components/Common/ScrollToTop';
import SupportChat from './components/Chat/SupportChat';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <CartProvider>
          {/* Layout bao bọc toàn bộ routes */}
          <Layout>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/build-pc" element={<BuildPcPage />} />
              <Route path="/order/:code" element={<OrderPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Chính sách (link ở cuối footer) */}
              <Route path="/privacy" element={<PolicyPage slug="privacy" />} />
              <Route path="/terms" element={<PolicyPage slug="terms" />} />
              <Route path="/return" element={<PolicyPage slug="return" />} />
              
              {/* Protected routes - yêu cầu đăng nhập */}
              <Route 
                path="/account" 
                element={
                  <ProtectedRoute>
                    <AccountPage />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/account/orders"
                element={
                  <ProtectedRoute>
                    <MyOrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/orders/:code"
                element={
                  <ProtectedRoute>
                    <MyOrderDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/checkout" 
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* 404 Not Found - Optional */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>

          {/* Chat hỗ trợ trực tiếp với nhân viên (có trợ lý AI) trên mọi trang */}
          <SupportChat />
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '14px',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
                style: {
                  background: '#22c55e',
                  color: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
                style: {
                  background: '#ef4444',
                  color: '#fff',
                },
              },
              loading: {
                style: {
                  background: '#6366f1',
                  color: '#fff',
                },
              },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

// 404 Page Component
const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Không tìm thấy trang</p>
      <a 
        href="/" 
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Về trang chủ
      </a>
    </div>
  );
};

export default App;