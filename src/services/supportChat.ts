import { tokenStorage } from './tokenStorage';

/**
 * Client chat hỗ trợ cho khách. Dùng fetch riêng (không qua axios dùng chung) vì interceptor của axios tự bật toast
 * cho MỌI lỗi — khung chat tự hiển thị lỗi tại chỗ cho gọn.
 */
export const API_BASE: string = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const CHAT_TOKEN_KEY = 'shoppc_chat_token';

export type SenderType = 'customer' | 'staff' | 'ai' | 'system';
export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_type: SenderType;
  sender_name: string | null;
  content: string;
  created_at: string;
}
export interface ChatConversation {
  id: number;
  status: 'open' | 'closed';
  ai_enabled: boolean;
  needs_human: boolean;
  unread_customer: number;
  customer_name: string | null;
}
export interface ChatState {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  staff_online: number;
  ai_available: boolean;
}

export class ChatApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const getToken = () => {
  try {
    return localStorage.getItem(CHAT_TOKEN_KEY);
  } catch {
    return null;
  }
};

async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['X-Visitor-Token'] = token;
  const login = tokenStorage.get(); // khách đã đăng nhập thì hội thoại gắn với tài khoản
  if (login) headers.Authorization = `Bearer ${login}`;
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: init.method || 'GET',
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ChatApiError(0, 'Không kết nối được tới máy chủ. Kiểm tra mạng rồi thử lại.');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) throw new ChatApiError(res.status, json.message || 'Có lỗi xảy ra, vui lòng thử lại.');
  return json.data as T;
}

export const supportChat = {
  /** Bắt đầu / khôi phục phiên chat; lưu token khách để lần sau vẫn thấy lịch sử. */
  async session(): Promise<ChatState> {
    const data = await request<ChatState & { visitor_token: string }>('/support/session', { method: 'POST', body: { visitor_token: getToken() || undefined } });
    try {
      localStorage.setItem(CHAT_TOKEN_KEY, data.visitor_token);
    } catch {
      /* chế độ ẩn danh: vẫn chat được trong phiên này */
    }
    return data;
  },
  send: (content: string, info: { name?: string; phone?: string } = {}) =>
    request<{ message: ChatMessage; conversation: ChatConversation }>('/support/messages', { method: 'POST', body: { content, ...info } }),
  messagesAfter: (afterId: number) => request<ChatMessage[]>(`/support/messages?after_id=${afterId}`),
  read: () => request<ChatConversation | null>('/support/read', { method: 'POST' }),
  typing: (typing: boolean) => request<unknown>('/support/typing', { method: 'POST', body: { typing } }).catch(() => undefined),
  requestHuman: () => request<ChatConversation>('/support/request-human', { method: 'POST' }),
  ticket: () => request<{ ticket: string }>('/support/ticket', { method: 'POST' }),
  streamUrl: (ticket: string) => `${API_BASE}/realtime/stream?ticket=${encodeURIComponent(ticket)}`,
  clearToken: () => {
    try {
      localStorage.removeItem(CHAT_TOKEN_KEY);
    } catch {
      /* bỏ qua */
    }
  },
  hasToken: () => !!getToken(),
};
