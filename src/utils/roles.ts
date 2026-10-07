/**
 * Vai trò (khớp backend: shoppc-be/src/config/roles.js).
 * Storefront chủ yếu phục vụ khách hàng (customer); nhân viên/quản trị dùng trang admin riêng.
 */
export type Role = 'admin' | 'staff' | 'customer';

export const ROLE_LABELS: Record<Role, string> = {
  customer: 'Khách hàng',
  staff: 'Nhân viên',
  admin: 'Quản trị viên',
};

export const ROLE_BADGE_CLASSES: Record<Role, string> = {
  customer: 'bg-green-100 text-green-800',
  staff: 'bg-blue-100 text-blue-800',
  admin: 'bg-purple-100 text-purple-800',
};

export const isRole = (role: unknown): role is Role =>
  role === 'admin' || role === 'staff' || role === 'customer';

export const roleLabel = (role: unknown): string => (isRole(role) ? ROLE_LABELS[role] : 'Khách hàng');
export const roleBadgeClass = (role: unknown): string => ROLE_BADGE_CLASSES[isRole(role) ? role : 'customer'];
