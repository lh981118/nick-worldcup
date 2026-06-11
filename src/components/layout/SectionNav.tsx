'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

interface Item { id: string; label: string; }

const SECTIONS: Item[] = [
  { id: 'resumen', label: 'Overview' },
  { id: 'grupos', label: 'Groups' },
  { id: 'bracket', label: 'Bracket' },
  { id: 'calendario', label: 'Calendar' },
  { id: 'stats', label: 'Stats' },
  { id: 'mercado', label: 'Market' },
];

export function SectionNav() {
  const locale = useLocale();
  const [active, setActive] = useState<string>('resumen');
  const labels: Record<string, string> =
    locale === 'zh'
      ? {
          resumen: '总览',
          grupos: '小组',
          bracket: '路径',
          calendario: '赛程',
          stats: '统计',
          mercado: '市场',
        }
      : locale === 'es'
        ? {
            resumen: 'Resumen',
            grupos: 'Grupos',
            bracket: 'Bracket',
            calendario: 'Calendario',
            stats: 'Stats',
            mercado: 'Mercado',
          }
        : {};

  useEffect(() => {
    const els = SECTIONS
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const handle = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  };

  return (
    <nav
      aria-label={locale === 'zh' ? '页面分区' : 'Sections'}
      className="sticky top-[4.5rem] z-30 mx-auto mt-2 max-w-[1280px] px-4 sm:top-20 sm:px-6"
    >
      <div className="-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
        <div className="mx-auto flex w-max min-w-full items-center gap-1 rounded-full border border-border bg-bg-0/70 p-1 font-mono text-[10px] uppercase tracking-[0.12em] shadow-card backdrop-blur-xl sm:w-fit sm:min-w-0 sm:text-[11px] sm:tracking-[0.15em]">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={handle(s.id)}
              aria-current={active === s.id ? 'true' : undefined}
              className={cn(
                'shrink-0 rounded-full px-2.5 py-1.5 transition-colors sm:px-3',
                active === s.id
                  ? 'bg-gold/15 text-gold'
                  : 'text-fg-2 hover:text-fg-0',
              )}
            >
              {labels[s.id] ?? s.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
