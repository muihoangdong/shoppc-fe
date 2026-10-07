import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CpuChipIcon,
  Squares2X2Icon,
  RectangleStackIcon,
  TvIcon,
  CircleStackIcon,
  BoltIcon,
  ArchiveBoxIcon,
  Cog6ToothIcon,
  SparklesIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ShoppingCartIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { builderService, BuilderConfig, BuilderPart, BuildReport, BuildSelection } from '../services/builderService';
import { cartService } from '../services/cartService';
import { useCart } from '../hooks/useCart';
import { formatPrice } from '../utils/formatters';
import { errorStatus } from '../services/api';

const ICONS: Record<string, React.ElementType> = {
  cpu: CpuChipIcon,
  mainboard: Squares2X2Icon,
  ram: RectangleStackIcon,
  vga: TvIcon,
  storage: CircleStackIcon,
  psu: BoltIcon,
  case: ArchiveBoxIcon,
  cooler: Cog6ToothIcon,
};
const STORAGE_KEY = 'shoppc_build';
const BUDGET_PRESETS = [15, 20, 30, 50];

const shortSpecs = (p: BuilderPart) =>
  Object.entries(p.build_specs || {})
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => {
      if (typeof v === 'boolean') return k === 'igpu' ? (v ? 'Có đồ họa tích hợp' : 'Không có đồ họa tích hợp') : '';
      if (Array.isArray(v)) return v.join('/');
      if (k.endsWith('_w')) return `${v}W`;
      if (k === 'capacity_gb') return Number(v) >= 1000 ? `${Number(v) / 1000}TB` : `${v}GB`;
      if (k === 'vram_gb') return `${v}GB VRAM`;
      if (k === 'length_mm' || k === 'max_gpu_length_mm') return `${v}mm`;
      if (k === 'modules') return `${v} thanh`;
      if (k === 'cores') return `${v} nhân`;
      if (k === 'ram_slots') return `${v} khe RAM`;
      if (k === 'm2_slots') return `${v} khe M.2`;
      return String(v);
    })
    .filter(Boolean)
    .join(' · ');

const loadSaved = (): BuildSelection => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
};

const IssueIcon = ({ level }: { level: string }) =>
  level === 'error' ? (
    <XCircleIcon className="h-5 w-5 shrink-0 text-red-600" />
  ) : level === 'warning' ? (
    <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-600" />
  ) : (
    <InformationCircleIcon className="h-5 w-5 shrink-0 text-blue-600" />
  );

export default function BuildPcPage() {
  const { refreshCart } = useCart();
  const [config, setConfig] = useState<BuilderConfig | null>(null);
  const [configError, setConfigError] = useState(false);
  const [selection, setSelection] = useState<BuildSelection>(loadSaved);
  const [report, setReport] = useState<BuildReport | null>(null);
  const [checking, setChecking] = useState(false);

  // Danh sách chọn linh kiện
  const [picking, setPicking] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<BuilderPart[] | null>(null);
  const [search, setSearch] = useState('');
  const [onlyCompatible, setOnlyCompatible] = useState(true);

  // AI
  const [budget, setBudget] = useState('20000000');
  const [purpose, setPurpose] = useState('gaming');
  const [note, setNote] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    document.title = 'Build PC - Tự chọn cấu hình - Shoppc';
    builderService.config().then(setConfig).catch(() => setConfigError(true));
  }, []);

  const runCheck = useCallback(async (sel: BuildSelection) => {
    try {
      setChecking(true);
      setReport(await builderService.check(sel));
    } catch (error) {
      // Linh kiện đã lưu không còn (bị xóa/đổi loại): bắt đầu lại. Lỗi mạng thì giữ nguyên cấu hình.
      if (errorStatus(error) === 400) {
        setSelection({});
        setReport(null);
      }
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    } catch {
      /* trình duyệt chặn lưu trữ: bỏ qua */
    }
    runCheck(selection);
  }, [selection, runCheck]);

  const openPicker = async (type: string) => {
    setPicking(type);
    setCandidates(null);
    setSearch('');
    setOnlyCompatible(true);
    const others = { ...selection };
    delete others[type];
    try {
      setCandidates(await builderService.parts(type, others));
    } catch {
      setPicking(null);
    }
  };

  const choose = (type: string, part: BuilderPart) => {
    setSelection((s) => ({ ...s, [type]: part.id }));
    setPicking(null);
  };

  const removePart = (type: string) =>
    setSelection((s) => {
      const next = { ...s };
      delete next[type];
      return next;
    });

  const itemOf = (type: string) => report?.items.find((i) => i.type === type);
  // "Cần thêm VGA" là thiếu món: chỉ nhắc ở ô VGA, không tô đỏ ô CPU
  const issuesFor = (type: string) =>
    (report?.issues || []).filter((i) => i.parts.includes(type) && i.code !== 'missing' && !(i.code === 'need_vga' && type !== 'vga'));

  const visibleCandidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (candidates || [])
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .filter((p) => !onlyCompatible || (p.compatible && p.stock > 0));
  }, [candidates, search, onlyCompatible]);

  const askAi = async () => {
    const b = Number(budget);
    if (!config || !Number.isInteger(b) || b < config.min_budget || b > config.max_budget) {
      toast.error(`Ngân sách từ ${formatPrice(config?.min_budget || 5000000)} đến ${formatPrice(config?.max_budget || 500000000)}`);
      return;
    }
    try {
      setAiBusy(true);
      setAiExplanation('');
      const result = await builderService.suggest(b, purpose, note.trim());
      setSelection(result.parts);
      setAiExplanation(result.explanation);
      toast.success(result.over_budget ? 'AI đã chọn xong (hơi vượt ngân sách)' : 'AI đã chọn xong cấu hình');
    } catch {
      /* api.ts đã hiện thông báo lỗi */
    } finally {
      setAiBusy(false);
    }
  };

  const addAllToCart = async () => {
    if (!report?.complete) return;
    try {
      setAdding(true);
      for (const item of report.items) {
        await cartService.addToCart(item.id, 1);
      }
      await refreshCart();
      toast.success(`Đã thêm ${report.items.length} linh kiện vào giỏ hàng`);
    } catch {
      toast.error('Chưa thêm đủ cấu hình vào giỏ, vui lòng kiểm tra giỏ hàng');
      await refreshCart();
    } finally {
      setAdding(false);
    }
  };

  if (configError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-gray-600">
        Không tải được trang Build PC. Vui lòng thử lại sau.
      </div>
    );
  }

  const errorCount = (report?.issues || []).filter((i) => i.level === 'error' && i.code !== 'missing' && i.code !== 'need_vga').length;
  const missing = (report?.issues || []).filter((i) => i.code === 'missing' || i.code === 'need_vga').map((i) => (i.code === 'need_vga' ? { ...i, parts: ['vga'] } : i));
  const pickingDef = config?.part_types.find((t) => t.key === picking);

  return (
    <div className="bg-gray-50 min-h-full">
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 py-8 md:py-10">
          <h1 className="text-2xl md:text-4xl font-bold">Build PC – Tự chọn cấu hình</h1>
          <p className="mt-2 text-white/85 max-w-2xl">
            Chọn từng linh kiện, hệ thống tự kiểm tra lắp có vừa không (socket, RAM, kích thước, nguồn). Hoặc cho AI chọn giúp theo ngân sách.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        {/* AI chọn giúp */}
        {config?.ai_enabled && (
          <div className="mb-6 rounded-2xl border border-purple-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <SparklesIcon className="h-6 w-6 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900">Để AI chọn cấu hình theo ngân sách</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto] md:items-end">
              <div>
                <label htmlFor="ai-budget" className="block text-sm font-medium text-gray-700 mb-1">Ngân sách (₫)</label>
                <input
                  id="ai-budget"
                  type="number"
                  min={config.min_budget}
                  step={500000}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="mt-1 flex flex-wrap gap-1">
                  {BUDGET_PRESETS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setBudget(String(m * 1000000))}
                      className={`rounded-full px-2 py-0.5 text-xs border ${Number(budget) === m * 1000000 ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-purple-300'}`}
                    >
                      {m} triệu
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="ai-purpose" className="block text-sm font-medium text-gray-700 mb-1">Nhu cầu</label>
                <select
                  id="ai-purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {Object.entries(config.purposes).map(([k, label]) => (
                    <option key={k} value={k}>{label.charAt(0).toUpperCase() + label.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ai-note" className="block text-sm font-medium text-gray-700 mb-1">Ghi chú thêm (không bắt buộc)</label>
                <input
                  id="ai-note"
                  type="text"
                  maxLength={300}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: chơi Valorant, ưu tiên card mạnh, thích vỏ trắng"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="button"
                onClick={askAi}
                disabled={aiBusy}
                className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
              >
                <SparklesIcon className="h-5 w-5" />
                {aiBusy ? 'AI đang chọn…' : 'Chọn giúp tôi'}
              </button>
            </div>
            {aiBusy && <p className="mt-3 text-sm text-purple-700">AI đang xem hàng trong kho và kiểm tra tương thích, thường mất 10–30 giây…</p>}
            {aiExplanation && (
              <div className="mt-4 rounded-lg bg-purple-50 p-4 text-sm text-gray-800 leading-relaxed">
                <span className="font-semibold text-purple-700">Gợi ý của AI: </span>
                {aiExplanation}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Các linh kiện */}
          <div className="space-y-3">
            {(config?.part_types || []).map((t) => {
              const Icon = ICONS[t.key] || CpuChipIcon;
              const item = itemOf(t.key);
              const problems = issuesFor(t.key).filter((i) => i.level !== 'info');
              const needed = problems.some((i) => i.code === 'need_vga');
              return (
                <div
                  key={t.key}
                  className={`rounded-xl border bg-white p-4 shadow-sm ${problems.some((i) => i.level === 'error' && i.code !== 'need_vga') ? 'border-red-300' : needed ? 'border-amber-300' : 'border-gray-200'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      {item?.image_url ? <img src={item.image_url} alt="" className="h-12 w-12 rounded-xl object-cover" /> : <Icon className="h-7 w-7" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {t.label} {!t.required && !needed && <span className="normal-case font-normal">(tùy chọn)</span>}
                        {needed && <span className="ml-1 normal-case font-semibold text-amber-600">(bắt buộc với CPU đã chọn)</span>}
                      </p>
                      {item ? (
                        <>
                          <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                          <p className="text-sm font-bold text-blue-600">{formatPrice(item.price)}</p>
                        </>
                      ) : (
                        <p className="text-gray-400">Chưa chọn</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {item && (
                        <button type="button" onClick={() => removePart(t.key)} aria-label={`Bỏ ${t.label}`} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openPicker(t.key)}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold ${item ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                      >
                        {item ? 'Đổi' : 'Chọn'}
                      </button>
                    </div>
                  </div>
                  {problems.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {problems.map((i) => (
                        <li key={i.code + i.message} className={`flex gap-2 text-sm ${i.level === 'error' && i.code !== 'need_vga' ? 'text-red-700' : 'text-amber-700'}`}>
                          <IssueIcon level={i.code === 'need_vga' ? 'warning' : i.level} /> {i.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
            {!config && <p className="text-gray-500">Đang tải…</p>}
          </div>

          {/* Tổng kết */}
          <aside className="lg:sticky lg:top-28 h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Cấu hình của bạn</h2>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-gray-600">Tổng tiền</span>
              <span className="text-2xl font-bold text-blue-600">{formatPrice(report?.total || 0)}</span>
            </div>
            {report && report.items.length > 0 && (
              <p className="mt-1 text-sm text-gray-600">
                Công suất ước tính ~{report.estimated_w}W · nên dùng nguồn từ {report.recommended_psu_w}W
              </p>
            )}

            <div className="mt-4" aria-live="polite">
              {checking && !report ? (
                <p className="text-sm text-gray-500">Đang kiểm tra…</p>
              ) : report?.complete ? (
                <p className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">
                  <CheckCircleIcon className="h-5 w-5" /> Cấu hình hợp lệ, các linh kiện lắp vừa nhau.
                </p>
              ) : errorCount > 0 ? (
                <p className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">
                  <XCircleIcon className="h-5 w-5" /> Có {errorCount} vấn đề tương thích cần sửa.
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  Còn thiếu: {missing.map((m) => config?.part_types.find((t) => m.parts.includes(t.key))?.label.replace(/\s*\(.*\)$/, '')).filter(Boolean).join(', ') || '—'}
                </p>
              )}
              {(report?.issues || []).filter((i) => i.level !== 'error').length > 0 && (
                <ul className="mt-3 space-y-2">
                  {report!.issues.filter((i) => i.level !== 'error').map((i) => (
                    <li key={i.code} className="flex gap-2 text-sm text-gray-700"><IssueIcon level={i.level} /> {i.message}</li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={addAllToCart}
              disabled={!report?.complete || adding}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCartIcon className="h-5 w-5" />
              {adding ? 'Đang thêm…' : 'Thêm cả bộ vào giỏ'}
            </button>
            {Object.keys(selection).length > 0 && (
              <button type="button" onClick={() => { setSelection({}); setAiExplanation(''); }} className="mt-2 w-full rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
                Xóa cấu hình, chọn lại từ đầu
              </button>
            )}
            <p className="mt-4 text-xs text-gray-500">
              Cần tư vấn thêm? Bấm nút chat ở góc phải hoặc xem <Link to="/return" className="text-blue-600 hover:underline">chính sách đổi trả</Link>.
            </p>
          </aside>
        </div>
      </div>

      {/* Hộp chọn linh kiện */}
      {picking && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={`Chọn ${pickingDef?.label}`} onClick={() => setPicking(null)}>
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="text-lg font-bold text-gray-900">Chọn {pickingDef?.label}</h3>
              <button type="button" onClick={() => setPicking(null)} aria-label="Đóng" className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-b p-4">
              <div className="relative flex-1 min-w-[180px]">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên…"
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={onlyCompatible} onChange={(e) => setOnlyCompatible(e.target.checked)} />
                Chỉ hiện món lắp được
              </label>
            </div>
            <div className="overflow-y-auto p-2">
              {candidates === null ? (
                <p className="p-6 text-center text-gray-500">Đang tải…</p>
              ) : visibleCandidates.length === 0 ? (
                <p className="p-6 text-center text-gray-500">
                  {candidates.length === 0 ? 'Cửa hàng chưa có linh kiện loại này.' : 'Không có món phù hợp. Bỏ chọn "Chỉ hiện món lắp được" để xem tất cả.'}
                </p>
              ) : (
                visibleCandidates.map((p) => {
                  const usable = p.compatible && p.stock > 0;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={!usable}
                      onClick={() => choose(picking, p)}
                      className={`flex w-full items-start gap-3 rounded-xl p-3 text-left ${usable ? 'hover:bg-blue-50' : 'cursor-not-allowed opacity-60'} ${selection[picking] === p.id ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                        {p.image_url ? <img src={p.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" /> : React.createElement(ICONS[picking] || CpuChipIcon, { className: 'h-6 w-6' })}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{shortSpecs(p)}</p>
                        {p.stock <= 0 && <p className="text-xs font-medium text-red-600">Hết hàng</p>}
                        {(p.reasons || []).map((r) => (
                          <p key={r} className="text-xs text-red-600">{r}</p>
                        ))}
                      </div>
                      <span className="shrink-0 font-bold text-blue-600">{formatPrice(p.price)}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
