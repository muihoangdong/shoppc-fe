import { Product } from '../types';
import { SpecTemplate } from '../services/customerService';
export interface SpecSelection { values?: string[]; min?: number | null; max?: number | null }
export interface SpecFacet { id: string; categoryId: number; templateIds: number[]; key: string; unit: string; type: string; options: string[]; min: number; max: number }
export function buildSpecFacets(products: Product[], templates: SpecTemplate[], categoryId: number | null): SpecFacet[] {
  if (!categoryId) return [];
  const result = new Map<string, SpecFacet>();
  const ambiguous = new Set<string>();
  const candidates = products.filter((p) => p.category_id === categoryId);
  for (const template of templates.filter((t) => t.category_id === categoryId)) {
    for (const field of template.fields) {
      const id = `${categoryId}:${field.key}`;
      if (ambiguous.has(id)) continue;
      const existing = result.get(id);
      if (existing && (existing.type !== field.type || existing.unit !== field.unit)) { result.delete(id); ambiguous.add(id); continue; }
      const values = candidates.filter((p) => p.spec_template_id === template.id).map((p) => p.specs?.[field.key]).filter((v) => v !== undefined && v !== null && String(v).trim() !== '');
      if (!values.length) continue;
      const options = [...new Set([...(existing?.options || []), ...values.map(String)])].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
      const numbers = options.map(Number).filter(Number.isFinite);
      if (field.type === 'number' && !numbers.length) continue;
      result.set(id, { id, categoryId, templateIds: [...(existing?.templateIds || []), template.id], key: field.key, unit: field.unit, type: field.type, options, min: Math.min(...numbers), max: Math.max(...numbers) });
    }
  }
  return [...result.values()];
}
export function matchesSpecFilters(product: Product, selected: Record<string, SpecSelection>, facets: SpecFacet[]): boolean {
  return Object.entries(selected).every(([id, selection]) => {
    if (!selection.values?.length && selection.min == null && selection.max == null) return true;
    const facet = facets.find((f) => f.id === id);
    if (!facet || product.category_id !== facet.categoryId || !facet.templateIds.includes(product.spec_template_id || 0)) return false;
    const value = product.specs?.[facet.key];
    if (value === undefined || value === null || String(value).trim() === '') return false;
    if (selection.values?.length && !selection.values.includes(String(value))) return false;
    if (selection.min != null || selection.max != null) {
      const n = Number(value);
      if (!Number.isFinite(n) || selection.min != null && n < selection.min || selection.max != null && n > selection.max) return false;
    }
    return true;
  });
}
