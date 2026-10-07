// src/services/authService.ts
import api from './api';
import { 
  ApiResponse, 
  User, 
  RegisterPayload,
  RegisterOtpInfo,
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
  // Đăng ký bước 1: gửi mã OTP tới email (tài khoản CHƯA được tạo). Gửi email có thể mất vài giây nên chờ lâu hơn.
  async register(payload: RegisterPayload): Promise<RegisterOtpInfo> {
    const response = await api.post<ApiResponse<RegisterOtpInfo>>('/auth/register', payload, { timeout: 30000 });
    return response.data.data;
  },

  // Đăng ký bước 2: nhập đúng mã => server tạo tài khoản và trả về token (đăng nhập luôn)
  async verifyRegistration(email: string, code: string): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register/verify', { email, code });
    const data = response.data.data;
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  },

  // Gửi lại mã OTP
  async resendRegistrationOtp(email: string): Promise<RegisterOtpInfo> {
    const response = await api.post<ApiResponse<RegisterOtpInfo>>('/auth/register/resend', { email }, { timeout: 30000 });
    return response.data.data;
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

  // Quên mật khẩu: server luôn trả cùng một thông báo (không tiết lộ email có tồn tại hay không)
  async forgotPassword(email: string): Promise<string> {
    const response = await api.post<ApiResponse<null>>('/auth/forgot-password', { email }, { timeout: 30000 });
    return response.data.message || 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.';
  },

  // Đặt lại mật khẩu bằng liên kết trong email
  async resetPassword(token: string, newPassword: string): Promise<string> {
    const response = await api.post<ApiResponse<null>>('/auth/reset-password', { token, new_password: newPassword });
    return response.data.message || 'Đặt lại mật khẩu thành công';
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

  // Đổi email (khách hàng): gửi mã tới email mới -> nhập mã
  async requestEmailChange(newEmail: string, currentPassword: string): Promise<RegisterOtpInfo> {
    const response = await api.post<ApiResponse<RegisterOtpInfo>>('/users/me/email', { new_email: newEmail, current_password: currentPassword }, { timeout: 30000 });
    return response.data.data;
  },

  async verifyEmailChange(newEmail: string, code: string): Promise<User> {
    const response = await api.post<ApiResponse<User>>('/users/me/email/verify', { new_email: newEmail, code });
    this.setUser(response.data.data);
    return response.data.data;
  },

  async resendEmailChange(newEmail: string): Promise<RegisterOtpInfo> {
    const response = await api.post<ApiResponse<RegisterOtpInfo>>('/users/me/email/resend', { new_email: newEmail }, { timeout: 30000 });
    return response.data.data;
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