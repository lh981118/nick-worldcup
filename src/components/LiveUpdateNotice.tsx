'use client';

import { useLocale } from 'next-intl';
import { Activity, CheckCircle2 } from 'lucide-react';
import { allResults, liveMeta } from '@/lib/sim/state';
import { teamNameById } from '@/lib/i18nNames';
import teamsData from '@/data/teams.json';

interface Team {
  id: string;
  name_es: string;
  name_en: string;
}

const TEAMS = (teamsData as { teams: Team[] }).teams;

export function LiveUpdateNotice() {
  const locale = useLocale();
  const meta = liveMeta();
  const completed = Object.values(allResults())
    .filter((r) => r.status === 'completed')
    .sort((a, b) => (b.kickoff_iso ?? '').localeCompare(a.kickoff_iso ?? ''));

  if (!meta.tournament_started || completed.length === 0) return null;

  const latest = completed[0];
  const home = teamNameById(latest.home, locale, TEAMS);
  const away = teamNameById(latest.away, locale, TEAMS);
  const updatedAt = meta.updated_at
    ? new Date(meta.updated_at).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-emerald/35 bg-emerald/10 p-4 shadow-[0_18px_60px_-28px_oklch(0.72_0.17_155/0.75)]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald text-bg-0">
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald">
            <Activity className="h-3.5 w-3.5" />
            {locale === 'zh' ? '赛后数据已同步' : 'Live data synced'}
          </div>
          <p className="mt-1 text-sm font-semibold text-fg-0">
            {home} {latest.gh}-{latest.ga} {away}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-fg-2">
            {locale === 'zh'
              ? `模型已纳入 ${completed.length} 场已结束比赛，页面会自动重算最新冠军概率。`
              : `The model includes ${completed.length} completed match${completed.length === 1 ? '' : 'es'} and auto-runs the latest forecast.`}
            {updatedAt ? ` ${locale === 'zh' ? '更新时间' : 'Updated'}：${updatedAt}` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
