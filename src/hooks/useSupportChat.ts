import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatApiError, ChatConversation, ChatMessage, supportChat } from '../services/supportChat';

export type ChatStatus = 'idle' | 'starting' | 'ready' | 'error';
type Typing = null | { sender: 'staff' | 'ai'; name?: string };

const MAX_BACKOFF = 30000;

/**
 * Toàn bộ trạng thái khung chat của khách: phiên, tin nhắn, realtime (SSE), chưa đọc, "đang gõ", "đã xem".
 * - Khách quay lại (đã có token) thì tự khôi phục ngay để nhận tin trả lời kể cả khi chưa mở khung chat.
 * - Khách mới: chỉ tạo phiên khi mở khung chat (không tạo phiên rác cho mọi người xem trang).
 */
export default function useSupportChat(open: boolean) {
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [error, setError] = useState('');
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [staffOnline, setStaffOnline] = useState(0);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [typing, setTyping] = useState<Typing>(null);
  const [unread, setUnread] = useState(0);
  const [seenByStaff, setSeenByStaff] = useState(false);
  const [live, setLive] = useState(false);

  const openRef = useRef(open);
  openRef.current = open;
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;
  const started = useRef(false);
  const esRef = useRef<EventSource | null>(null);
  const timers = useRef<{ reconnect?: number; typing?: number; read?: number }>({});
  const attempt = useRef(0);
  const closed = useRef(false);

  const append = useCallback((m: ChatMessage) => {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m].sort((a, b) => a.id - b.id)));
  }, []);

  const markReadSoon = useCallback(() => {
    window.clearTimeout(timers.current.read);
    timers.current.read = window.setTimeout(() => {
      if (!openRef.current || document.visibilityState !== 'visible') return;
      setUnread(0);
      supportChat.read().catch(() => undefined);
    }, 400);
  }, []);

  const connect = useCallback(async () => {
    if (closed.current || esRef.current || typeof EventSource === 'undefined') return;
    try {
      const { ticket } = await supportChat.ticket();
      if (closed.current) return;
      const es = new EventSource(supportChat.streamUrl(ticket));
      esRef.current = es;
      let first = true;
      es.addEventListener('ready', () => {
        attempt.current = 0;
        setLive(true);
        if (!first) return;
        first = false;
        // vừa kết nối lại: lấy những tin đã lỡ trong lúc mất kết nối
        const last = messagesRef.current.length ? messagesRef.current[messagesRef.current.length - 1].id : 0;
        if (last) supportChat.messagesAfter(last).then((list) => list.forEach(append)).catch(() => undefined);
      });
      es.addEventListener('presence', (e: Event) => {
        try {
          setStaffOnline(Number(JSON.parse((e as MessageEvent).data).staff_online) || 0);
        } catch {
          /* bỏ qua */
        }
      });
      es.addEventListener('chat:message', (e: Event) => {
        try {
          const { message, conversation: c } = JSON.parse((e as MessageEvent).data);
          append(message);
          if (c) setConversation((cur) => ({ ...(cur || {}), ...c }));
          if (message.sender_type === 'staff' || message.sender_type === 'ai') {
            setTyping(null);
            if (openRef.current && document.visibilityState === 'visible') markReadSoon();
            else setUnread((n) => n + 1);
          }
          if (message.sender_type === 'customer') setSeenByStaff(false);
        } catch {
          /* bỏ qua */
        }
      });
      es.addEventListener('chat:typing', (e: Event) => {
        try {
          const d = JSON.parse((e as MessageEvent).data);
          if (d.sender !== 'staff' && d.sender !== 'ai') return;
          window.clearTimeout(timers.current.typing);
          setTyping(d.typing ? { sender: d.sender, name: d.name } : null);
          if (d.typing) timers.current.typing = window.setTimeout(() => setTyping(null), 8000);
        } catch {
          /* bỏ qua */
        }
      });
      es.addEventListener('chat:read', () => setSeenByStaff(true));
      es.addEventListener('chat:conversation', (e: Event) => {
        try {
          const { conversation: c } = JSON.parse((e as MessageEvent).data);
          if (c) setConversation((cur) => ({ ...(cur || {}), ...c }));
        } catch {
          /* bỏ qua */
        }
      });
      const retry = (delay?: number) => {
        es.close();
        if (esRef.current === es) esRef.current = null;
        setLive(false);
        if (closed.current) return;
        const wait = delay ?? Math.min(1000 * 2 ** attempt.current, MAX_BACKOFF);
        attempt.current += 1;
        timers.current.reconnect = window.setTimeout(() => void connect(), wait);
      };
      es.addEventListener('shutdown', () => retry(3000));
      es.onerror = () => retry();
      // các lần kết nối sau: lần "ready" đầu tiên của mỗi EventSource đều đồng bộ lại (first = true ở trên)
    } catch {
      setLive(false);
      if (closed.current) return;
      const wait = Math.min(1000 * 2 ** attempt.current, MAX_BACKOFF);
      attempt.current += 1;
      timers.current.reconnect = window.setTimeout(() => void connect(), wait);
    }
  }, [append, markReadSoon]);

  const start = useCallback(async () => {
    if (started.current) return;
    started.current = true;
    setStatus('starting');
    setError('');
    try {
      const s = await supportChat.session();
      setConversation(s.conversation);
      setMessages(s.messages);
      setStaffOnline(s.staff_online);
      setAiAvailable(s.ai_available);
      setUnread(s.conversation ? s.conversation.unread_customer : 0);
      setStatus('ready');
      void connect();
    } catch (err) {
      started.current = false;
      setStatus('error');
      setError(err instanceof Error && err.message ? err.message : 'Không mở được khung chat');
    }
  }, [connect]);

  // Khách quay lại (đã có token): khôi phục ngay. Khách mới: khi mở khung chat lần đầu.
  useEffect(() => {
    if (supportChat.hasToken()) void start();
  }, [start]);
  useEffect(() => {
    if (open) {
      void start();
      markReadSoon();
    }
  }, [open, start, markReadSoon]);

  useEffect(() => {
    closed.current = false;
    const onVisible = () => {
      if (document.visibilityState === 'visible' && openRef.current) markReadSoon();
      if (document.visibilityState === 'visible' && started.current && !esRef.current) {
        window.clearTimeout(timers.current.reconnect);
        attempt.current = 0;
        void connect();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    const t = timers.current;
    return () => {
      closed.current = true;
      document.removeEventListener('visibilitychange', onVisible);
      esRef.current?.close();
      esRef.current = null;
      window.clearTimeout(t.reconnect);
      window.clearTimeout(t.typing);
      window.clearTimeout(t.read);
    };
  }, [connect, markReadSoon]);

  /** Token khách hết hạn / không hợp lệ: tạo phiên mới rồi thử lại một lần. */
  const withSession = async <T,>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof ChatApiError && err.status === 401) {
        supportChat.clearToken();
        started.current = false;
        esRef.current?.close();
        esRef.current = null;
        await start();
        return fn();
      }
      throw err;
    }
  };

  const send = async (content: string, info: { name?: string; phone?: string } = {}) => {
    const res = await withSession(() => supportChat.send(content, info));
    append(res.message);
    setConversation(res.conversation);
    setSeenByStaff(false);
    if (!esRef.current) void connect();
    return res;
  };

  const requestHuman = async () => {
    const c = await withSession(() => supportChat.requestHuman());
    setConversation(c);
    const last = messagesRef.current.length ? messagesRef.current[messagesRef.current.length - 1].id : 0;
    supportChat.messagesAfter(last).then((list) => list.forEach(append)).catch(() => undefined);
  };

  return { status, error, retry: start, conversation, messages, staffOnline, aiAvailable, typing, unread, seenByStaff, live, send, requestHuman };
}
