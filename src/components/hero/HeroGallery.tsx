'use client';

import { useEffect, useMemo, useRef } from 'react';
import { CalendarDays, ChevronRight, CircleCheck, CircleX, Clock3, Trophy } from 'lucide-react';
import { useLocale } from 'next-intl';
import { gsap } from 'gsap';
import { entrancePlayed, markEntrancePlayed } from '@/lib/entranceAnimation';
import { cn, formatPct } from '@/lib/utils';
import { teamDisplayName } from '@/lib/i18nNames';
import { useSelection } from '@/hooks/useSelection';
import { Flag } from '../Flag';
import stateData from '@/data/tournament_state.json';
import auditData from '@/data/prediction_audit.json';
import teamsData from '@/data/teams.json';
import type { SerializedResult } from '@/lib/sim/worker';
import type { Team } from '@/lib/sim/types';

interface Props {
  result: SerializedResult | null;
}

interface LiveResult {
  stage: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final' | '3rd';
  home: string;
  away: string;
  status: 'completed' | 'scheduled';
  kickoff_iso?: string;
}

interface Forecast {
  predicted_gh: number;
  predicted_ga: number;
}

interface AuditResult extends Forecast {
  actual_gh: number;
  actual_ga: number;
  exact_score_hit: boolean;
}

interface PredictionAuditFile {
  forecasts: Record<string, Forecast>;
  results: Record<string, AuditResult>;
}

const LIVE_RESULTS = (stateData as { results: Record<string, LiveResult> }).results;
const AUDIT = auditData as PredictionAuditFile;
const TEAM_BY_ID = new Map((teamsData as { teams: Team[] }).teams.map((team) => [team.id, team]));

function shanghaiDateKey(iso?: string): string {
  if (!iso) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function shanghaiTime(iso?: string): string {
  if (!iso) return '--:--';
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

function modalScore(scoreHist: number[]): { home: number; away: number; prob: number } {
  let bestIdx = 0;
  let bestCount = -1;
  let total = 0;
  for (let i = 0; i < scoreHist.length; i++) {
    total += scoreHist[i];
    if (scoreHist[i] > bestCount) {
      bestCount = scoreHist[i];
      bestIdx = i;
    }
  }
  return {
    home: Math.floor(bestIdx / 8),
    away: bestIdx % 8,
    prob: total > 0 ? bestCount / total : 0,
  };
}

export function HeroGallery({ result }: Props) {
  const locale = useLocale();
  const rootRef = useRef<HTMLDivElement>(null);
  const openFixture = useSelection((s) => s.openFixture);

  const cards = useMemo(() => {
    const teamById = result ? new Map(result.teams.map((team) => [team.id, team])) : TEAM_BY_ID;
    const fixtureByKey = new Map(result?.fixtures ?? []);
    const today = shanghaiDateKey(new Date().toISOString());

    const all = Object.entries(LIVE_RESULTS)
      .filter(([, match]) => match.kickoff_iso)
      .map(([key, match]) => {
        const fixture = fixtureByKey.get(key);
        const forecast = AUDIT.forecasts[key];
        const predicted = fixture
          ? modalScore(fixture.scoreHist)
          : forecast
            ? { home: forecast.predicted_gh, away: forecast.predicted_ga, prob: 0 }
            : null;
        const audit = AUDIT.results[key];
        const shownScore = audit
          ? { home: audit.predicted_gh, away: audit.predicted_ga, prob: predicted?.prob ?? 0 }
          : predicted;

        return {
          key,
          match,
          homeTeam: teamById.get(match.home),
          awayTeam: teamById.get(match.away),
          localDate: shanghaiDateKey(match.kickoff_iso),
          shownScore,
          audit,
          canOpen: Boolean(fixture),
        };
      })
      .filter((item) => item.homeTeam && item.awayTeam && item.shownScore)
      .sort((a, b) => (a.match.kickoff_iso ?? '').localeCompare(b.match.kickoff_iso ?? ''));

    const todays = all.filter((item) => item.localDate === today);
    const future = all.filter((item) => item.match.status !== 'completed' && item.localDate > today);
    const picked = todays.length > 0 ? [...todays, ...future].slice(0, 4) : future.slice(0, 4);
    return picked.length > 0 ? picked : all.slice(-4);
  }, [result]);

  useEffect(() => {
    if (!rootRef.current) return;
    const cardNodes = rootRef.current.querySelectorAll('.daily-pick-card');
    const key = `daily-picks-${locale}`;
    if (entrancePlayed(key)) {
      gsap.set(cardNodes, { opacity: 1, y: 0 });
      return;
    }
    markEntrancePlayed(key);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardNodes,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.7, ease: 'expo.out', delay: 0.15 },
      );
    }, rootRef);
    return () => ctx.revert();
  }, [locale, cards.length]);

  return (
    <div ref={rootRef} className="relative w-full overflow-hidden rounded-2xl border border-emerald/25 bg-bg-0/78 p-3 shadow-[0_28px_72px_-28px_rgba(45,212,191,0.55)] backdrop-blur-xl sm:p-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          background:
            'linear-gradient(135deg, oklch(0.70 0.16 180 / 0.22), transparent 42%), radial-gradient(circle at 78% 10%, oklch(0.88 0.14 85 / 0.18), transparent 34%)',
        }}
        aria-hidden
      />

      <header className="relative z-10 mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald/30 bg-emerald/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-emerald">
            <CalendarDays className="h-3 w-3" />
            {locale === 'zh' ? '每日赛前预测' : 'Daily Picks'}
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-fg-0 sm:text-3xl">
            {locale === 'zh' ? '今日比赛预测比分' : 'Today score predictions'}
          </h2>
          <p className="mt-1 max-w-lg text-xs leading-relaxed text-fg-2 sm:text-sm">
            {locale === 'zh'
              ? '打开就能看今日比分预测，想看完整模型再手动模拟。'
              : 'See today picks instantly. Run the full model only when needed.'}
          </p>
        </div>
        <div className="hidden rounded-full border border-gold/25 bg-gold/10 p-2 text-gold sm:block">
          <Trophy className="h-5 w-5" />
        </div>
      </header>

      <div className="relative z-10 grid gap-2.5">
        {cards.map(({ key, match, homeTeam, awayTeam, shownScore, audit, canOpen }) => {
          if (!homeTeam || !awayTeam || !shownScore) return null;
          const completed = match.status === 'completed';
          const homeWin = shownScore.home > shownScore.away;
          const awayWin = shownScore.home < shownScore.away;

          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (canOpen) openFixture(key);
              }}
              className={cn(
                'daily-pick-card group grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-xl border border-border/70 bg-bg-1/72 px-3 py-3 text-left transition hover:border-emerald/45 hover:bg-bg-2/80',
                canOpen ? 'cursor-pointer hover:shadow-glow' : 'cursor-default',
              )}
            >
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <Flag code={homeTeam.flag} size={22} />
                  <span className={cn('truncate text-sm font-semibold', homeWin ? 'text-emerald' : 'text-fg-0')}>
                    {teamDisplayName(homeTeam, locale)}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-fg-3">
                  {shanghaiTime(match.kickoff_iso)}
                  <span className="mx-1">·</span>
                  {match.stage === 'group' ? `${locale === 'zh' ? '小组赛' : 'Group'} ${key.split(':')[0]}` : match.stage.toUpperCase()}
                </div>
              </div>

              <div className="flex min-w-[92px] flex-col items-center">
                <div className="font-display text-3xl font-black leading-none text-fg-0 tabular">
                  {shownScore.home}
                  <span className="mx-1 text-fg-3">-</span>
                  {shownScore.away}
                </div>
                <div className="mt-1 flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] text-fg-3">
                  {completed ? (
                    audit?.exact_score_hit ? (
                      <>
                        <CircleCheck className="h-3 w-3 text-emerald" />
                        <span className="text-emerald">{locale === 'zh' ? '已命中' : 'Hit'}</span>
                      </>
                    ) : (
                      <>
                        <CircleX className="h-3 w-3 text-rose" />
                        <span className="text-rose">{locale === 'zh' ? '未命中' : 'Miss'}</span>
                      </>
                    )
                  ) : (
                    <>
                      <Clock3 className="h-3 w-3" />
                      <span>
                        {locale === 'zh' ? '预测' : 'Pick'}
                        {shownScore.prob > 0 ? ` ${formatPct(shownScore.prob, 1)}` : ''}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="min-w-0 text-right">
                <div className="mb-1 flex items-center justify-end gap-2">
                  <span className={cn('truncate text-sm font-semibold', awayWin ? 'text-emerald' : 'text-fg-0')}>
                    {teamDisplayName(awayTeam, locale)}
                  </span>
                  <Flag code={awayTeam.flag} size={22} />
                </div>
                <div className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald/90">
                  {completed && audit
                    ? `${locale === 'zh' ? '实际' : 'Actual'} ${audit.actual_gh}-${audit.actual_ga}`
                    : canOpen
                      ? locale === 'zh' ? '查看详情' : 'Details'
                      : locale === 'zh' ? '默认预测' : 'Default pick'}
                  {canOpen && <ChevronRight className="h-3 w-3 transition group-hover:translate-x-0.5" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="relative z-10 mt-3 rounded-xl border border-border/60 bg-bg-1/50 px-3 py-2 font-mono text-[10px] leading-relaxed text-fg-3">
        {locale === 'zh'
          ? '无需等待模拟，赛前预测比分会直接展示。'
          : 'No simulation wait: score picks are shown immediately.'}
      </div>
    </div>
  );
}
