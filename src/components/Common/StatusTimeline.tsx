export default function StatusTimeline({
  status,
  type,
  createdAt,
}: {
  status: string;
  type: 'return' | 'warranty';
  createdAt: string;
}) {
  const stages =
    type === 'return'
      ? [
          { key: 'requested', label: 'Gửi yêu cầu' },
          { key: 'approved', label: 'Duyệt yêu cầu' },
          { key: 'received', label: 'Nhận hàng trả' },
          { key: 'refunded', label: 'Ghi nhận hoàn tiền' },
        ]
      : [
          { key: 'received', label: 'Tiếp nhận' },
          { key: 'diagnosing', label: 'Kiểm tra' },
          { key: 'repairing', label: 'Sửa chữa' },
          { key: 'resolved', label: 'Hoàn tất' },
        ];
  const current = stages.findIndex((step) => step.key === status);
  const ended = ['rejected', 'cancelled', 'closed'].includes(status);
  // Only show milestones the API actually establishes; repair can be skipped on resolution.
  const isReached = (index: number) =>
    index === 0 ||
    index === current ||
    (type === 'return' && index < current) ||
    (type === 'warranty' && current < 3 && index < current);
  return (
    <div className="mt-4">
      <ol aria-label="Tiến độ xử lý" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stages.map((stage, index) => (
          <li
            key={stage.key}
            aria-current={index === current ? 'step' : undefined}
            className={`border-l-2 pl-3 text-xs ${isReached(index) ? 'border-blue-500 text-slate-800' : 'border-slate-200 text-slate-400'}`}
          >
            <span className="block font-medium">{stage.label}</span>
            <span className="mt-1 block text-[11px]">
              {index === 0
                ? new Date(createdAt).toLocaleDateString('vi-VN')
                : index === current
                  ? 'Trạng thái hiện tại'
                  : isReached(index)
                    ? 'Đã qua bước này'
                    : '—'}
            </span>
          </li>
        ))}
      </ol>
      {ended && (
        <p className="mt-3 text-xs text-slate-600">
          {status === 'rejected'
            ? 'Yêu cầu đã bị từ chối.'
            : status === 'cancelled'
              ? 'Yêu cầu đã được hủy.'
              : 'Phiếu đã kết thúc xử lý, không hoàn tiền.'}
        </p>
      )}
    </div>
  );
}
