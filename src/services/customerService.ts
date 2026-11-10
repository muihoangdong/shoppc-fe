import api from './api';
import { Product } from '../types';
export interface CustomerState { wishlist: number[]; alerts: number[]; email: string; mail_available: boolean }
export interface SpecField { key: string; type: 'text' | 'number' | 'select'; unit: string; options: string[]; required: boolean }
export interface SpecTemplate { id: number; name: string; category_id: number; fields: SpecField[] }
export interface WarrantyTicket { id: number; ticket_code: string; status: string; issue: string; resolution: string; created_at: string; completed_at: string | null }
export interface WarrantyRecord { id: number; serial_number: string; status: string; sold_at: string; warranty_expires_at: string; product_name: string; order_code: string; tickets: WarrantyTicket[] }
export interface ReturnItem { id: number; product_name: string; order_code: string; available_quantity: number; price: number }
export interface ReturnRecord { id: number; return_code: string; order_code: string; product_name: string; quantity: number; status: string; reason: string; refund_amount: number; created_at: string }
export interface StockAlert { product_id: number; name: string; status: string; stock: number; notified_at: string | null }
export const customerService = {
  async state() { return (await api.get<{ data: CustomerState }>('/customer/state', { silent: true })).data.data; },
  async wishlist() { return (await api.get<{ data: Product[] }>('/customer/wishlist')).data.data; },
  async setWishlist(id: number, enabled: boolean) { await api.request({ url: `/customer/wishlist/${id}`, method: enabled ? 'PUT' : 'DELETE' }); },
  async setAlert(id: number, enabled: boolean) { await api.request({ url: `/customer/stock-alerts/${id}`, method: enabled ? 'PUT' : 'DELETE' }); },
  async alerts() { return (await api.get<{ data: StockAlert[] }>('/customer/stock-alerts')).data.data; },
  async warranties(search = '') { return (await api.get<{ data: WarrantyRecord[] }>('/customer/warranties', { params: { search } })).data.data; },
  async returnItems(order = '') { return (await api.get<{ data: ReturnItem[] }>('/customer/return-items', { params: { order } })).data.data; },
  async returns() { return (await api.get<{ data: ReturnRecord[] }>('/customer/returns')).data.data; },
  async createReturn(body: { order_item_id: number; quantity: number; reason: string }) { await api.post('/customer/returns', body); },
  async cancelReturn(id: number) { await api.post(`/customer/returns/${id}/cancel`); },
  async specFields() { return (await api.get<{ data: SpecTemplate[] }>('/customer/spec-fields', { silent: true })).data.data; },
};
