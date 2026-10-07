// src/contexts/AuthContext.tsx
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import type { AuthContextType, LoginPayload, RegisterPayload, User } from '../types';

type Props = {
  children: React.ReactNode;
};

// eslint-disable-next-line react-refresh/only-export-components -- context/hook dùng chung, không ảnh hưởng khi chạy
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    toast.success('Đã đăng xuất');
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        setUser(null);
        return;
      }

      const response = await authService.getMe();
      if (response.success) {
        setUser(response.data);
      } else {
        authService.logout();
        setUser(null);
      }
    } catch (error) {
      authService.logout();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      await fetchMe();
      setIsLoading(false);
    };

    loadUser();
  }, [fetchMe]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authService.login(payload);
    if (response.success) {
      setUser(response.data.user);  // response.data là AuthResponse { token, user }
      toast.success('Đăng nhập thành công');
    }
  }, []);

  // Đăng ký bước 1: gửi mã OTP (lỗi đã được api.ts hiện thông báo)
  const register = useCallback((payload: RegisterPayload) => authService.register(payload), []);

  // Đăng ký bước 2: nhập đúng mã => tài khoản được tạo và đăng nhập luôn
  const verifyRegistration = useCallback(async (email: string, code: string) => {
    const data = await authService.verifyRegistration(email, code);
    setUser(data.user);
    toast.success('Xác nhận email thành công! Chào mừng bạn đến với Shoppc');
  }, []);

  const resendRegistrationOtp = useCallback((email: string) => authService.resendRegistrationOtp(email), []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    verifyRegistration,
    resendRegistrationOtp,
    logout,
    refreshUser: fetchMe,
  }), [fetchMe, isLoading, login, logout, register, verifyRegistration, resendRegistrationOtp, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}