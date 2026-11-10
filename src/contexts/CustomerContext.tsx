import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { customerService, CustomerState } from '../services/customerService';
import { errorMessage } from '../services/api';

const empty: CustomerState = { wishlist: [], alerts: [], email: '', mail_available: false };
type Value = { data: CustomerState; ready: boolean; busy: Set<string>; toggle: (kind: 'wishlist' | 'alerts', id: number) => Promise<void>; refresh: () => Promise<void> };
const CustomerContext = createContext<Value | null>(null);
export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate(), location = useLocation();
  const [data, setData] = useState(empty), [owner, setOwner] = useState<number | null>(null);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(new Set<string>());
  const pending = useRef(new Set<string>()), currentUser = useRef(user?.id);
  currentUser.current = user?.id;
  const refresh = useCallback(async () => {
    const uid = user?.id;
    if (!uid) return;
    const result = await customerService.state();
    if (currentUser.current === uid) { setData(result); setOwner(uid); setReady(true); }
  }, [user?.id]);
  useEffect(() => {
    setData(empty); setOwner(null); setReady(false);
    if (user) void refresh().catch(() => { /* Retry is offered by account screens/actions. */ });
  }, [user, refresh]);
  const toggle = async (kind: 'wishlist' | 'alerts', id: number) => {
    if (!user) { toast('Đăng nhập để lưu theo tài khoản'); navigate('/login', { state: { from: location.pathname + location.search } }); return; }
    const uid = user.id, key = `${uid}:${kind}:${id}`;
    if (pending.current.has(key)) return;
    pending.current.add(key); setBusy(new Set(pending.current));
    try {
      let state = data;
      if (owner !== uid || !ready) {
        try { state = await customerService.state(); }
        catch (e) { toast.error(errorMessage(e, 'Không tải được dữ liệu tài khoản. Vui lòng thử lại.')); return; }
      }
      const enabled = !state[kind].includes(id);
      if (kind === 'wishlist') await customerService.setWishlist(id, enabled);
      else await customerService.setAlert(id, enabled);
      if (currentUser.current !== uid) return;
      setData((prev) => ({ ...(owner === uid ? prev : state), [kind]: enabled ? [...new Set([...(owner === uid ? prev : state)[kind], id])] : (owner === uid ? prev : state)[kind].filter((n) => n !== id) }));
      setOwner(uid); setReady(true);
      toast.success(kind === 'wishlist' ? (enabled ? 'Đã lưu vào yêu thích' : 'Đã bỏ yêu thích') : enabled ? `Sẽ gửi báo hàng về tới ${state.email}` : 'Đã hủy báo hàng về');
    } catch { /* api interceptor displays the error; never show success on failure. */ }
    finally { pending.current.delete(key); setBusy(new Set(pending.current)); }
  };
  return <CustomerContext.Provider value={{ data: owner === user?.id ? data : empty, ready: ready && owner === user?.id, busy, toggle, refresh }}>{children}</CustomerContext.Provider>;
}
// eslint-disable-next-line react-refresh/only-export-components
export function useCustomer() { const value = useContext(CustomerContext); if (!value) throw new Error('CustomerProvider missing'); return value; }
