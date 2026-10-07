import React, { useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  ShieldCheckIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { POLICIES, STORE, findPolicy, type Policy } from '../content/policies';

const ICONS: Record<Policy['slug'], React.ElementType> = {
  privacy: ShieldCheckIcon,
  terms: DocumentTextIcon,
  return: ArrowPathIcon,
};

interface PolicyPageProps {
  slug: Policy['slug'];
}

/** Trang Chính sách bảo mật / Điều khoản sử dụng / Chính sách đổi trả (nội dung ở src/content/policies.ts). */
const PolicyPage: React.FC<PolicyPageProps> = ({ slug }) => {
  const policy = findPolicy(slug)!;
  const Icon = ICONS[slug];
  const tabsRef = useRef<HTMLDivElement>(null);

  // Link nằm ở cuối footer: mở trang mới thì cuộn lên đầu, và đặt tiêu đề tab trình duyệt
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = `${policy.title} - Shoppc`;
    // Điện thoại: thanh chọn cuộn ngang, đưa mục đang xem vào giữa cho thấy rõ
    const box = tabsRef.current;
    const active = box?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (box && active) box.scrollLeft = active.offsetLeft - (box.clientWidth - active.offsetWidth) / 2;
  }, [policy.title]);

  return (
    <div className="bg-gray-50 min-h-full">
      {/* Tiêu đề */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <nav className="text-sm text-white/70 mb-4" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-white">Trang chủ</Link>
            <span className="mx-2">/</span>
            <span className="text-white">{policy.title}</span>
          </nav>
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Icon className="h-8 w-8" />
            </span>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold">{policy.title}</h1>
              <p className="text-white/80 text-sm mt-1">Cập nhật lần cuối: {policy.updated}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Chuyển nhanh giữa 3 chính sách */}
        <div ref={tabsRef} className="relative mb-8 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Các chính sách">
          {POLICIES.map((p) => {
            const TabIcon = ICONS[p.slug];
            return (
              <NavLink
                key={p.slug}
                to={p.path}
                role="tab"
                aria-selected={p.slug === slug}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-400 hover:text-blue-600'
                  }`
                }
              >
                <TabIcon className="h-4 w-4" />
                {p.title}
              </NavLink>
            );
          })}
        </div>

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Mục lục (màn hình lớn) */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Nội dung</p>
              <ol className="space-y-2 text-sm">
                {policy.sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-gray-600 hover:text-blue-600">
                      {s.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          <article className="[overflow-wrap:anywhere] rounded-2xl bg-white p-6 md:p-10 shadow-sm border border-gray-100">
            <p className="text-gray-700 leading-relaxed text-base md:text-lg">{policy.intro}</p>

            {policy.sections.map((s) => (
              <section key={s.id} id={s.id} className="mt-8 scroll-mt-28">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3">{s.heading}</h2>
                {s.paragraphs?.map((t, i) => (
                  <p key={i} className="text-gray-700 leading-relaxed mb-3">
                    {t}
                  </p>
                ))}
                {s.bullets && (
                  <ul className="space-y-2">
                    {s.bullets.map((b, i) => (
                      <li key={i} className="flex gap-3 text-gray-700 leading-relaxed">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {s.note && <p className="mt-3 text-gray-700 leading-relaxed">{s.note}</p>}
              </section>
            ))}

            {/* Liên hệ */}
            <div className="mt-10 rounded-xl border border-blue-100 bg-blue-50 p-5">
              <p className="font-semibold text-gray-900 mb-3">Cần hỗ trợ thêm? Liên hệ {STORE.name}:</p>
              <div className="grid gap-3 text-sm text-gray-700 sm:grid-cols-3">
                <a href={STORE.phoneHref} className="flex items-center gap-2 hover:text-blue-600">
                  <PhoneIcon className="h-5 w-5 text-blue-600" /> {STORE.phone}
                </a>
                <a href={`mailto:${STORE.email}`} className="flex items-center gap-2 hover:text-blue-600 break-all">
                  <EnvelopeIcon className="h-5 w-5 shrink-0 text-blue-600" /> {STORE.email}
                </a>
                <span className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-blue-600" /> {STORE.hours}
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

export default PolicyPage;
