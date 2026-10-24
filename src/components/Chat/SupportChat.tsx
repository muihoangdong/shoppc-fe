import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useSupportChat from '../../hooks/useSupportChat';
import { supportChat, ChatMessage } from '../../services/supportChat';
import { tokenStorage } from '../../services/tokenStorage';

const QUICK = ['Tư vấn cấu hình 20-30 triệu chơi game', 'Kiểm tra tương thích CPU & Main', 'Kiểm tra đơn hàng của tôi', 'Chính sách bảo hành'];

const timeOf = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m-9 6 2.6-2.6A2 2 0 0 1 8 17h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v13z" />
  </svg>
);

/** Khung chat nổi cho khách: trò chuyện trực tiếp với nhân viên (realtime), có trợ lý AI trả lời khi nhân viên chưa phản hồi. */
const SupportChat: React.FC = () => {
  const [open, setOpen] = useState(false);
  const chat = useSupportChat(open);
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [handingOff, setHandingOff] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const lastTyping = useRef(0);
  const idle = useRef<number | undefined>(undefined);
  const loggedIn = !!tokenStorage.get();
  const askContact = !loggedIn && !chat.conversation;

  useLayoutEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.messages.length, chat.typing, open]);

  useEffect(() => () => window.clearTimeout(idle.current), []);

  const onType = (value: string) => {
    setText(value);
    if (!chat.conversation) return;
    const now = Date.now();
    if (value.trim() && now - lastTyping.current > 2500) {
      lastTyping.current = now;
      void supportChat.typing(true);
    }
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => void supportChat.typing(false), 3000);
  };

  const send = async (value: string) => {
    const content = value.trim();
    if (!content || sending) return;
    setSending(true);
    setSendError('');
    window.clearTimeout(idle.current);
    try {
      await chat.send(content, askContact ? { name: name.trim() || undefined, phone: phone.trim() || undefined } : {});
      setText('');
    } catch (err) {
      setSendError(err instanceof Error && err.message ? err.message : 'Không gửi được tin nhắn');
    } finally {
      setSending(false);
    }
  };

  const handoff = async () => {
    setHandingOff(true);
    try {
      await chat.requestHuman();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Không gọi được nhân viên, vui lòng thử lại');
    } finally {
      setHandingOff(false);
    }
  };

  const lastCustomerId = [...chat.messages].reverse().find((m) => m.sender_type === 'customer')?.id;
  const lastMsg = chat.messages[chat.messages.length - 1];
  const showSeen = chat.seenByStaff && lastMsg && lastMsg.sender_type === 'customer';
  const presence = chat.staffOnline > 0
    ? 'Nhân viên đang trực tuyến'
    : chat.aiAvailable
    ? 'Trợ lý AI trả lời ngay · nhân viên sẽ phản hồi sớm'
    : 'Để lại tin nhắn, chúng tôi sẽ phản hồi sớm nhất';

  const bubble = (m: ChatMessage) => {
    if (m.sender_type === 'system') {
      return (
        <p key={m.id} data-testid={`chat-msg-${m.id}`} className="self-center px-4 text-center text-xs italic text-gray-500">
          {m.content}
        </p>
      );
    }
    const mine = m.sender_type === 'customer';
    return (
      <div key={m.id} data-testid={`chat-msg-${m.id}`} data-sender={m.sender_type} className={`flex max-w-[85%] flex-col ${mine ? 'self-end items-end' : 'self-start items-start'}`}>
        {!mine && <span className="mb-0.5 text-[11px] text-gray-400">{m.sender_type === 'ai' ? 'Trợ lý AI' : m.sender_name || 'Nhân viên'}</span>}
        <div
          className={`whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
            mine ? 'rounded-br-sm bg-blue-600 text-white' : m.sender_type === 'ai' ? 'rounded-bl-sm bg-purple-100 text-purple-900' : 'rounded-bl-sm border bg-white text-gray-800'
          }`}
        >
          {m.content}
        </div>
        <span className="mt-0.5 text-[10px] text-gray-400">
          {timeOf(m.created_at)}
          {showSeen && m.id === lastCustomerId ? ' · Đã xem' : ''}
        </span>
      </div>
    );
  };

  return (
    <>
      {open && (
        <div role="dialog" aria-label="Chat hỗ trợ" className="fixed bottom-24 right-4 z-50 flex h-[34rem] max-h-[calc(100vh-7rem)] w-[24rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:right-6">
          <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-blue-700 to-blue-500 px-4 py-3 text-white">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <ChatIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">ShopPC AI Assistant</p>
              <p className="flex items-center gap-1.5 truncate font-mono text-[11px] text-blue-100" data-testid="chat-presence">
                <span className={`h-2 w-2 shrink-0 rounded-full ${chat.staffOnline > 0 ? 'bg-green-300' : 'bg-blue-200'}`} />
                {presence}
              </p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Đóng chat" className="rounded-lg p-1.5 hover:bg-white/15">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">
                <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div ref={listRef} className="flex flex-1 flex-col gap-2 overflow-y-auto bg-slate-50 p-3" data-testid="chat-list" aria-live="polite">
            <div className="max-w-[85%] self-start rounded-2xl rounded-bl-sm border bg-white px-3 py-2 text-sm text-gray-800">
              Chào bạn! Mình là ShopPC AI Assistant. Bạn đang cần tư vấn build cấu hình PC chơi game / đồ họa, kiểm tra độ tương thích linh kiện hay hỗ trợ đơn hàng?
            </div>
            {chat.status === 'starting' && <p className="text-center text-xs text-gray-400">Đang kết nối…</p>}
            {chat.status === 'error' && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2 text-center text-xs text-red-700">
                {chat.error}{' '}
                <button onClick={() => void chat.retry()} className="underline">
                  Thử lại
                </button>
              </div>
            )}
            {chat.messages.map(bubble)}
            {chat.messages.length === 0 && chat.status === 'ready' && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK.map((q) => (
                  <button key={q} onClick={() => void send(q)} className="rounded-md border border-blue-200 bg-white px-2.5 py-1 font-mono text-[11px] text-blue-700 hover:bg-blue-50">
                    {q}
                  </button>
                ))}
              </div>
            )}
            {chat.typing && (
              <p data-testid="chat-typing" className="self-start rounded-2xl border bg-white px-3 py-2 text-xs text-gray-500">
                {chat.typing.sender === 'ai' ? 'Trợ lý AI đang trả lời…' : `${chat.typing.name || 'Nhân viên'} đang nhập…`}
              </p>
            )}
          </div>

          <div className="border-t bg-white p-3">
            {chat.conversation && chat.conversation.ai_enabled && !chat.conversation.needs_human && chat.conversation.status === 'open' && (
              <button onClick={() => void handoff()} disabled={handingOff} className="mb-2 text-xs text-blue-600 underline disabled:opacity-50">
                {handingOff ? 'Đang chuyển…' : 'Gặp nhân viên tư vấn'}
              </button>
            )}
            {askContact && (
              <div className="mb-2 grid grid-cols-2 gap-2">
                <input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} maxLength={100} placeholder="Tên của bạn (không bắt buộc)" aria-label="Tên của bạn" className="rounded-lg border px-2 py-1.5 text-xs" />
                <input value={phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)} maxLength={20} inputMode="tel" placeholder="SĐT (không bắt buộc)" aria-label="Số điện thoại" className="rounded-lg border px-2 py-1.5 text-xs" />
              </div>
            )}
            {sendError && (
              <p role="alert" className="mb-2 text-xs text-red-600">
                {sendError}
              </p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onType(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    void send(text);
                  }
                }}
                rows={1}
                maxLength={2000}
                disabled={chat.status === 'error'}
                placeholder="Nhập câu hỏi hoặc yêu cầu tư vấn cấu hình…"
                aria-label="Nhập tin nhắn"
                className="max-h-28 min-h-[2.5rem] flex-1 resize-none rounded-xl border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <button onClick={() => void send(text)} disabled={sending || !text.trim() || chat.status === 'error'} aria-label="Gửi tin nhắn" className="rounded-xl bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-40">
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Đóng chat hỗ trợ' : 'Mở chat hỗ trợ'}
        className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-600/30 transition hover:scale-105 sm:right-6"
      >
        <ChatIcon />
        {!open && chat.unread > 0 && (
          <span data-testid="chat-unread" className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
            {chat.unread > 9 ? '9+' : chat.unread}
          </span>
        )}
      </button>
    </>
  );
};

export default SupportChat;
