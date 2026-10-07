import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { StarIcon as StarSolid, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { reviewService, ProductReview, ProductReviewsPage } from '../../services/reviewService';
import { formatDate } from '../../utils/formatters';
import { errorMessage } from '../../services/api';

const LABELS = ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Tuyệt vời'];
const MAX = 1000;

export const Stars: React.FC<{ value: number; size?: string; label?: string }> = ({ value, size = 'h-5 w-5', label }) => (
  <span className="inline-flex items-center" role="img" aria-label={label ?? `${value} trên 5 sao`}>
    {[1, 2, 3, 4, 5].map((i) => {
      const fill = Math.max(0, Math.min(1, value - (i - 1)));
      return (
        <span key={i} className={`relative inline-block ${size}`}>
          <StarOutline className={`absolute inset-0 ${size} text-amber-400`} />
          {fill > 0 && (
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <StarSolid className={`${size} text-amber-400`} />
            </span>
          )}
        </span>
      );
    })}
  </span>
);

const StarPicker: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-3">
      <div className="flex" role="radiogroup" aria-label="Chọn số sao" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} sao - ${LABELS[i]}`}
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            className="p-0.5"
          >
            {i <= shown ? <StarSolid className="h-8 w-8 text-amber-400" /> : <StarOutline className="h-8 w-8 text-gray-300" />}
          </button>
        ))}
      </div>
      <span className="text-sm font-medium text-gray-700">{shown ? LABELS[shown] : 'Chọn số sao'}</span>
    </div>
  );
};

const ReviewItem: React.FC<{ r: ProductReview }> = ({ r }) => (
  <li className="py-5">
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="font-semibold text-gray-900">{r.customer_name}</span>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
        <CheckBadgeIcon className="h-4 w-4" /> Đã mua hàng
      </span>
    </div>
    <div className="mt-1 flex items-center gap-2">
      <Stars value={r.rating} size="h-4 w-4" />
      <span className="text-xs text-gray-500">{formatDate(r.created_at)}</span>
    </div>
    {r.comment && <p className="mt-2 whitespace-pre-line break-words text-gray-700">{r.comment}</p>}
    {r.admin_reply && (
      <div className="mt-3 rounded-lg border-l-4 border-blue-500 bg-blue-50 px-4 py-3 text-sm">
        <p className="font-semibold text-blue-800">Phản hồi từ Shoppc</p>
        <p className="mt-1 whitespace-pre-line break-words text-gray-700">{r.admin_reply}</p>
      </div>
    )}
  </li>
);

/** Đánh giá sản phẩm: chỉ khách đã nhận hàng mới được viết; ai cũng xem được. */
const ProductReviews: React.FC<{ productId: number }> = ({ productId }) => {
  const location = useLocation();
  const [data, setData] = useState<ProductReviewsPage | null>(null);
  const [items, setItems] = useState<ProductReview[]>([]);
  const [filter, setFilter] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (rate?: number) => {
    try {
      setFailed(false);
      const res = await reviewService.getForProduct(productId, 1, rate);
      setData(res);
      setItems(res.items);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    setLoading(true);
    setFilter(undefined);
    setEditing(false);
    void load();
  }, [load]);

  // Mở từ "Đánh giá sản phẩm" ở trang đơn hàng (#danh-gia): cuộn tới khi đánh giá đã tải xong
  useEffect(() => {
    if (!loading && location.hash === '#danh-gia') document.getElementById('danh-gia')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [loading, location.hash]);

  const changeFilter = (rate?: number) => {
    setFilter(rate);
    void load(rate);
  };

  const loadMore = async () => {
    if (!data || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await reviewService.getForProduct(productId, data.page + 1, filter);
      setData({ ...res, viewer: data.viewer, summary: data.summary });
      setItems((prev) => [...prev, ...res.items]);
    } catch {
      toast.error('Không tải thêm được đánh giá');
    } finally {
      setLoadingMore(false);
    }
  };

  const startEdit = () => {
    const mine = data?.viewer.my_review;
    setRating(mine?.rating ?? 0);
    setComment(mine?.comment ?? '');
    setFormError('');
    setEditing(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return setFormError('Hãy chọn số sao');
    setSaving(true);
    setFormError('');
    try {
      const res = await reviewService.submit(productId, rating, comment);
      toast.success(res.message);
      setEditing(false);
      await load(filter);
    } catch (error) {
      setFormError(errorMessage(error, 'Không gửi được đánh giá, vui lòng thử lại'));
    } finally {
      setSaving(false);
    }
  };

  const removeMine = async () => {
    if (!window.confirm('Xóa đánh giá của bạn?')) return;
    try {
      await reviewService.removeMine(productId);
      toast.success('Đã xóa đánh giá');
      await load(filter);
    } catch {
      /* api.ts đã báo lỗi */
    }
  };

  if (loading) return <section className="mt-8 rounded-lg bg-white p-6 shadow-lg text-gray-500">Đang tải đánh giá…</section>;
  if (failed || !data) {
    return (
      <section className="mt-8 rounded-lg bg-white p-6 shadow-lg text-gray-500">
        Chưa tải được đánh giá.{' '}
        <button onClick={() => { setLoading(true); void load(filter); }} className="font-medium text-blue-600 hover:underline">Thử lại</button>
      </section>
    );
  }

  const { summary, viewer } = data;
  const mine = viewer.my_review;

  return (
    <section id="danh-gia" className="mt-8 rounded-lg bg-white p-6 shadow-lg" aria-labelledby="reviews-title">
      <h2 id="reviews-title" className="text-2xl font-bold text-gray-900">Đánh giá sản phẩm</h2>

      <div className="mt-5 grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="text-center md:border-r md:pr-6">
          <p className="text-5xl font-bold text-gray-900">{summary.count ? summary.average.toFixed(1) : '–'}</p>
          <div className="mt-2"><Stars value={summary.average} /></div>
          <p className="mt-1 text-sm text-gray-500">{summary.count} đánh giá</p>
        </div>
        <div className="space-y-1.5">
          {([5, 4, 3, 2, 1] as const).map((s) => {
            const n = summary.distribution[s];
            const pct = summary.count ? Math.round((n / summary.count) * 100) : 0;
            const active = filter === s;
            return (
              <button
                key={s}
                type="button"
                disabled={!n && !active}
                onClick={() => changeFilter(active ? undefined : s)}
                aria-pressed={active}
                className={`flex w-full items-center gap-3 rounded px-2 py-1 text-sm transition disabled:cursor-default ${active ? 'bg-amber-50 ring-1 ring-amber-300' : 'hover:bg-gray-50'}`}
              >
                <span className="w-10 shrink-0 text-left text-gray-700">{s} ★</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <span className="block h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-10 shrink-0 text-right text-gray-500">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Khu vực của khách đang xem */}
      <div className="mt-6 rounded-lg border border-gray-200 p-4">
        {editing ? (
          <form onSubmit={submit} className="space-y-3" noValidate>
            <p className="font-semibold text-gray-900">{mine ? 'Sửa đánh giá của bạn' : 'Viết đánh giá'}</p>
            <StarPicker value={rating} onChange={(v) => { setRating(v); setFormError(''); }} />
            <div>
              <label htmlFor="review-comment" className="sr-only">Nhận xét</label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, MAX))}
                rows={4}
                placeholder="Chia sẻ trải nghiệm của bạn: chất lượng, hiệu năng, đóng gói, giao hàng… (không bắt buộc)"
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-right text-xs text-gray-400">{comment.length}/{MAX}</p>
            </div>
            {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Đang gửi…' : mine ? 'Lưu đánh giá' : 'Gửi đánh giá'}
              </button>
              <button type="button" onClick={() => setEditing(false)} disabled={saving} className="rounded-lg border border-gray-300 px-5 py-2 text-gray-700 hover:bg-gray-50">
                Hủy
              </button>
            </div>
          </form>
        ) : mine ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-gray-900">Đánh giá của bạn</p>
              <div className="flex gap-3 text-sm">
                <button onClick={startEdit} className="font-medium text-blue-600 hover:underline">Sửa</button>
                <button onClick={() => void removeMine()} className="font-medium text-red-600 hover:underline">Xóa</button>
              </div>
            </div>
            <div className="mt-1"><Stars value={mine.rating} size="h-4 w-4" /></div>
            {mine.comment && <p className="mt-2 whitespace-pre-line break-words text-gray-700">{mine.comment}</p>}
            {mine.status === 'hidden' && (
              <p className="mt-2 rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">Đánh giá này đang được cửa hàng ẩn khỏi trang sản phẩm.</p>
            )}
            {mine.admin_reply && (
              <div className="mt-3 rounded-lg border-l-4 border-blue-500 bg-blue-50 px-4 py-3 text-sm">
                <p className="font-semibold text-blue-800">Phản hồi từ Shoppc</p>
                <p className="mt-1 whitespace-pre-line text-gray-700">{mine.admin_reply}</p>
              </div>
            )}
          </div>
        ) : viewer.can_review ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-gray-700">Bạn đã mua sản phẩm này. Hãy chia sẻ cảm nhận để giúp khách khác chọn mua!</p>
            <button onClick={startEdit} className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700">Viết đánh giá</button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <ChatBubbleLeftEllipsisIcon className="h-5 w-5 shrink-0 text-gray-400" />
            <span className="flex-1">{viewer.reason}</span>
            {viewer.code === 'login' && (
              <Link to="/login" state={{ from: `${location.pathname}#danh-gia` }} className="font-semibold text-blue-600 hover:underline">
                Đăng nhập
              </Link>
            )}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-gray-500">
          {filter ? `Chưa có đánh giá ${filter} sao.` : 'Chưa có đánh giá nào cho sản phẩm này.'}
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-gray-100">
          {items.map((r) => <ReviewItem key={r.id} r={r} />)}
        </ul>
      )}

      {data.page < data.pages && (
        <div className="mt-2 text-center">
          <button onClick={() => void loadMore()} disabled={loadingMore} className="rounded-lg border border-gray-300 px-5 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            {loadingMore ? 'Đang tải…' : 'Xem thêm đánh giá'}
          </button>
        </div>
      )}
    </section>
  );
};

export default ProductReviews;
