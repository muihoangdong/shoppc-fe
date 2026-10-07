// src/services/builderService.ts — API trang Build PC
import api from './api';
import type { ApiResponse } from '../types';

export interface BuildField {
  key: string;
  label: string;
  type: 'text' | 'int' | 'bool' | 'enum' | 'multi';
  required?: boolean;
  options?: string[];
}

export interface PartTypeDef {
  key: string;
  label: string;
  required: boolean;
  fields: BuildField[];
}

export interface BuilderConfig {
  part_types: PartTypeDef[];
  purposes: Record<string, string>;
  ai_enabled: boolean;
  min_budget: number;
  max_budget: number;
}

export interface BuilderPart {
  id: number;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  part_type: string;
  build_specs: Record<string, unknown>;
  specs: Record<string, unknown>;
  /** Có trong danh sách ứng viên: lắp được với các món đang chọn không */
  compatible?: boolean;
  reasons?: string[];
}

export interface BuildIssue {
  level: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  parts: string[];
}

export interface BuildReport {
  items: { type: string; id: number; name: string; price: number; stock: number; image_url: string | null }[];
  total: number;
  total_text: string;
  estimated_w: number;
  recommended_psu_w: number;
  issues: BuildIssue[];
  compatible: boolean;
  complete: boolean;
}

export interface BuildSuggestion {
  parts: Record<string, number>;
  report: BuildReport;
  over_budget: boolean;
  explanation: string;
}

export type BuildSelection = Record<string, number>;

export const builderService = {
  async config(): Promise<BuilderConfig> {
    const r = await api.get<ApiResponse<BuilderConfig>>('/builder/config');
    return r.data.data;
  },

  async parts(type: string, selected: BuildSelection): Promise<BuilderPart[]> {
    const r = await api.get<ApiResponse<BuilderPart[]>>(`/builder/parts/${type}`, { params: selected });
    return r.data.data;
  },

  async check(selected: BuildSelection): Promise<BuildReport> {
    const r = await api.post<ApiResponse<BuildReport>>('/builder/check', { parts: selected });
    return r.data.data;
  },

  // AI chọn nhiều bước (xem hàng, kiểm tra, sửa) nên chờ lâu hơn bình thường
  async suggest(budget: number, purpose: string, note: string): Promise<BuildSuggestion> {
    const r = await api.post<ApiResponse<BuildSuggestion>>('/builder/suggest', { budget, purpose, note }, { timeout: 120000 });
    return r.data.data;
  },
};

export default builderService;
