'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { HeaderProfile } from './HeaderProfile';

const NAV_ITEMS = [
  { href: '/#simulate', key: 'nav_simulate' as const },
  { href: '/backtest', key: 'backtest' as const },
  { href: '/demo', key: 'nav_demo' as const },
  { href: '/methodology', key: 'nav_methodology' as const },
] as const;

export function Header() {
  const t = useTranslations('header');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const switchLocale = (to: 'es' | 'en' | 'zh') => {
    router.replace(pathname, { locale: to });
  };

  const navLinkClass = (href: string, mobile: boolean) => {
    const path = href.split('#')[0] || '/';
    const active = path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`);

    return cn(
      'font-medium transition-colors',
      mobile
        ? 'block rounded-xl px-4 py-3 text-base'
        : 'text-sm',
      active ? 'text-gold' : 'text-fg-0/85 hover:text-gold',
      mobile && !active && 'text-fg-1 hover:bg-bg-1/60',
      mobile && active && 'bg-gold/10',
    );
  };

  const renderNavItem = (item: (typeof NAV_ITEMS)[number], mobile = false) => (
    <Link
      key={item.key}
      href={item.href}
      onClick={() => setMenuOpen(false)}
      className={navLinkClass(item.href, mobile)}
    >
      {t(item.key)}
    </Link>
  );

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'py-2' : 'py-3 sm:py-4',
      )}
    >
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <div
          className={cn(
            'flex min-w-0 flex-1 items-center justify-between gap-2 rounded-full border px-3 transition-all duration-300 sm:gap-6 sm:px-5',
            scrolled
              ? 'glass h-12 border-border'
              : 'h-12 border-transparent sm:h-14',
          )}
        >
          <Link href="/" className="group flex min-w-0 flex-1 items-center gap-2 sm:flex-initial sm:gap-2.5">
            <Image
              src="/nick-logo.jpg"
              alt="NICK"
              width={96}
              height={96}
              priority
              className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-gold/80 transition-transform group-hover:scale-105 sm:h-9 sm:w-9"
            />
            <span className="hidden truncate text-sm font-medium tracking-wide text-fg-0 min-[420px]:inline sm:max-w-none">
              {t('brand')}
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm md:flex">
            {NAV_ITEMS.map((item) => renderNavItem(item))}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <div className="flex items-center gap-0.5 rounded-full border border-border bg-bg-1/40 p-0.5">
              <button
                onClick={() => switchLocale('zh')}
                className={cn(
                  'rounded-full px-2 py-1 text-xs font-medium transition-colors sm:px-3',
                  locale === 'zh' ? 'bg-gold text-bg-0' : 'text-fg-0/80 hover:text-fg-0',
                )}
                aria-label="中文"
              >
                {t('lang_zh')}
              </button>
              <button
                onClick={() => switchLocale('es')}
                className={cn(
                  'rounded-full px-2 py-1 text-xs font-medium transition-colors sm:px-3',
                  locale === 'es' ? 'bg-gold text-bg-0' : 'text-fg-0/80 hover:text-fg-0',
                )}
                aria-label="Español"
              >
                {t('lang_es')}
              </button>
              <button
                onClick={() => switchLocale('en')}
                className={cn(
                  'rounded-full px-2 py-1 text-xs font-medium transition-colors sm:px-3',
                  locale === 'en' ? 'bg-gold text-bg-0' : 'text-fg-0/80 hover:text-fg-0',
                )}
                aria-label="English"
              >
                {t('lang_en')}
              </button>
            </div>

            <a
              href="/nick-wechat.jpg"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="查看 NICK 微信二维码"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/50 bg-gold text-bg-0 shadow-glow-gold transition-transform hover:scale-105 active:scale-95 sm:hidden"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="currentColor">
                <path d="M4 4h7v7H4V4zm2 2v3h3V6H6zm7-2h7v7h-7V4zm2 2v3h3V6h-3zM4 13h7v7H4v-7zm2 2v3h3v-3H6zm9-2h2v2h-2v-2zm-2 2h2v2h-2v-2zm4 0h3v2h-3v-2zm-4 4h2v1h-2v-1zm3-2h2v3h-2v-3zm3 1h1v2h-1v-2z" />
              </svg>
            </a>

            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-1/40 text-fg-0 md:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <HeaderProfile variant="bar" />
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-14 z-40 bg-bg-0/60 backdrop-blur-sm md:hidden"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            className="glass absolute inset-x-3 top-[calc(100%+0.5rem)] z-50 rounded-2xl border border-border p-2 shadow-card md:hidden"
            aria-label="Mobile navigation"
          >
            <HeaderProfile variant="menu" className="mb-2" />
            {NAV_ITEMS.map((item) => renderNavItem(item, true))}
          </nav>
        </>
      )}
    </header>
  );
}
