'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';

const qrLink = '/nick-wechat.jpg';
const socialBtn =
  'inline-flex items-center justify-center rounded-lg font-medium transition-all hover:scale-105 active:scale-95';

interface Props {
  variant?: 'bar' | 'menu';
  className?: string;
}

export function HeaderProfile({ variant = 'bar', className }: Props) {
  const t = useTranslations('header');

  if (variant === 'menu') {
    return (
      <div
        className={cn(
          'rounded-2xl border border-gold/50 bg-gradient-to-br from-gold/25 via-gold/12 to-bg-1/40 p-4 shadow-glow-gold',
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <Image
            src="/nick-logo.jpg"
            alt="NICK"
            width={96}
            height={96}
            className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-gold shadow-[0_0_20px_-4px_oklch(0.76_0.13_180/0.8)]"
          />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold text-fg-0">NICK</p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-gold">
              {t('dev_label')}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-fg-1">{t('dev_hint')}</p>
          </div>
        </div>

        <a
          href={qrLink}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(socialBtn, 'mt-4 w-full gap-2 bg-gold px-3 py-2.5 text-sm text-bg-0 shadow-glow-gold')}
        >
          <QrCode className="h-4 w-4 shrink-0" />
          <span className="truncate">{t('dev_wechat')}</span>
        </a>

        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-white p-2">
          <Image
            src="/nick-wechat.jpg"
            alt="NICK 微信二维码"
            width={900}
            height={1125}
            className="h-auto w-full rounded-lg object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative hidden shrink-0 items-center gap-2 rounded-2xl border border-gold/55 sm:flex',
        'bg-gradient-to-r from-gold/22 via-gold/14 to-gold/6 px-2 py-1.5',
        'shadow-glow-gold transition-all duration-200',
        'hover:border-gold hover:from-gold/30 hover:via-gold/18 hover:to-gold/8',
        'hover:shadow-[0_0_36px_-6px_oklch(0.76_0.13_180/0.75)]',
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(ellipse 80% 100% at 0% 50%, oklch(0.88 0.11 180 / 0.18), transparent 70%)',
        }}
      />

      <Image
        src="/nick-logo.jpg"
        alt="NICK"
        width={96}
        height={96}
        className="relative h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-gold/90 ring-offset-1 ring-offset-bg-0"
      />

      <div className="relative hidden min-w-0 pr-0.5 min-[860px]:block">
        <p className="font-display text-sm font-bold leading-none text-fg-0">NICK</p>
        <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-gold">
          {t('dev_label')}
        </p>
      </div>

      <a
        href={qrLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="查看 NICK 微信二维码"
        title={t('dev_wechat')}
        className={cn(socialBtn, 'relative h-8 w-8 bg-gold text-bg-0 shadow-[0_4px_14px_-4px_oklch(0.76_0.13_180/0.9)]')}
      >
        <QrCode className="h-4 w-4" />
      </a>
    </div>
  );
}
