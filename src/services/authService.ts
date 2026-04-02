// src/services/authService.ts
import api from './api';
import { 
  ApiResponse, 
  User, 
  RegisterPayload,
  LoginPayload,
  UpdateMePayload,
  ChangePasswordPayload,
  AuthResponse 
} from '../types';

const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
} as const;

export const authService = {
  // Đăng ký
  async register(payload: RegisterPayload): Promise<{ success: boolean; message?: string; data: { id: number } }> {
    const response = await api.post<ApiResponse<{ id: number }>>('/auth/register', payload);
    return {
      success: response.data.success,
      message: response.data.message,
      data: response.data.data
    };
  },

  // Đăng nhập - Trả về AuthResponse trực tiếp (không qua data wrapper)
  async login(payload: LoginPayload): Promise<{ success: boolean; data: AuthResponse }> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', payload);
    
    // response.data có cấu trúc: { success, message, data: { token, user } }
    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.token);
      this.setUser(response.data.data.user);
    }
    
    return {
      success: response.data.success,
      data: response.data.data  // data là AuthResponse { token, user }
    };
  },

  // Lấy thông tin user hiện tại
  async getMe(): Promise<{ success: boolean; data: User }> {
    const response = await api.get<ApiResponse<User>>('/users/me');
    
    if (response.data.success && response.data.data) {
      this.setUser(response.data.data);
    }
    
    return {
      success: response.data.success,
      data: response.data.data
    };
  },

  // Cập nhật thông tin user
  async updateMe(payload: UpdateMePayload): Promise<{ success: boolean; data: User }> {
    const response = await api.put<ApiResponse<User>>('/users/me', payload);
    
    if (response.data.success && response.data.data) {
      this.setUser(response.data.data);
    }
    
    return {
      success: response.data.success,
      data: response.data.data
    };
  },

  // Đổi mật khẩu
  async changePassword(payload: ChangePasswordPayload): Promise<{ success: boolean; message: string }> {
    const response = await api.put<ApiResponse<{ message: string }>>('/users/me/password', payload);
    return {
      success: response.data.success,
      message: response.data.message || 'Đổi mật khẩu thành công'
    };
  },

  // ==================== TOKEN MANAGEMENT ====================
  
  setToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  },

  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  removeToken(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  },

  // ==================== USER MANAGEMENT ====================
  
  setUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getUser(): User | null {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  removeUser(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  clearStorage(): void {
    this.removeToken();
    this.removeUser();
  },

  // ==================== AUTH STATE ====================
  
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  logout(): void {
    this.clearStorage();
  },

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'admin';
  },

  isStaff(): boolean {
    const user = this.getUser();
    return user?.role === 'staff' || user?.role === 'admin';
  }
};

export default authService;