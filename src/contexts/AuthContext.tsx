// src/contexts/AuthContext.tsx
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import type { AuthContextType, LoginPayload, RegisterPayload, User } from '../types';

type Props = {
  children: React.ReactNode;
};

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

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authService.register(payload);
    if (response.success) {
      toast.success(response.message || 'Đăng ký thành công! Vui lòng đăng nhập');
    } else {
      toast.error(response.message || 'Đăng ký thất bại');
    }
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    logout,
    refreshUser: fetchMe,
  }), [fetchMe, isLoading, login, logout, register, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}