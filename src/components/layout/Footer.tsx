import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { QrCode } from 'lucide-react';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="relative z-10 mt-4 border-t border-border py-6 sm:mt-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-2">
          <p className="text-xs text-fg-2">{t('credits')}</p>
          <a
            href="#methodology"
            className="inline-block text-xs text-fg-1 underline decoration-gold/40 underline-offset-4 hover:decoration-gold"
          >
            {t('methodology_link')}
          </a>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="text-right">
            <p className="text-xs text-fg-1">
              {t('made_by')} <span className="font-semibold text-gold">NICK</span>
            </p>
            <a
              href="/nick-wechat.jpg"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-xs text-fg-2 transition-colors hover:text-gold"
            >
              <QrCode className="h-3.5 w-3.5" />
              {t('wechat')}
            </a>
          </div>
          <a
            href="/nick-wechat.jpg"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="查看 NICK 微信二维码"
            className="block overflow-hidden rounded-lg border border-border bg-white p-1 shadow-card"
          >
            <Image
              src="/nick-wechat.jpg"
              alt="NICK 微信二维码"
              width={96}
              height={120}
              className="h-16 w-16 object-cover object-center"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
