'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { CircleCheck, CircleX, Clock3 } from 'lucide-react';
import { Flag } from './Flag';
import { cn } from '@/lib/utils';
import { teamDisplayName } from '@/lib/i18nNames';
import teamsData from '@/data/teams.json';
import stateData from '@/data/tournament_state.json';
import auditData from '@/data/prediction_audit.json';
import type { Team } from '@/lib/sim/types';

type Stage = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final' | '3rd';

interface Forecast {
  stage: Stage;
  home: string;
  away: string;
  predicted_gh: number;
  predicted_ga: number;
}

interface AuditResult extends Forecast {
  actual_gh: number;
  actual_ga: number;
  exact_score_hit: boolean;
}

interface AuditFile {
  _meta: {
    accuracy: {
      exact_score_hits: number;
      settled_matches: number;
      exact_score_rate: number;
    };
  };
  forecasts: Record<string, Forecast>;
  results: Record<string, AuditResult>;
}

interface LiveResult {
  status: 'completed' | 'scheduled';
  kickoff_iso?: string;
}

const TEAMS = (teamsData as { teams: Team[] }).teams;
const TEAM_BY_ID = new Map(TEAMS.map((team) => [team.id, team]));
const AUDIT = auditData as AuditFile;
const LIVE_RESULTS = (stateData as { results: Record<string, LiveResult> }).results;

const STAGE_ORDER: Stage[] = ['group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final'];

function stageLabel(stage: Stage, key: string, locale: string): string {
  if (stage === 'group') {
    const group = key.includes(':') ? key.split(':')[0] : '';
    return locale === 'zh' ? `小组赛 ${group}` : `Group ${group}`;
  }
  const zh: Record<Stage, string> = {
    group: '小组赛',
    r32: '32 强',
    r16: '16 强',
    qf: '8 强',
    sf: '半决赛',
    '3rd': '三四名决赛',
    final: '决赛',
  };
  return locale === 'zh' ? zh[stage] : stage.toUpperCase();
}

function sortKey(key: string, forecast: Forecast): string {
  const rank = STAGE_ORDER.indexOf(forecast.stage);
  if (forecast.stage === 'group') return `${rank}-${key.padStart(4, '0')}`;
  return `${rank}-${Number.parseInt(key, 10) || 999}`;
}

function formatTime(iso?: string): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

export function DefaultPredictionCalendar() {
  const locale = useLocale();

  const rows = useMemo(() => {
    return Object.entries(AUDIT.forecasts)
      .map(([key, forecast]) => {
        const result = AUDIT.results[key];
        const homeTeam = TEAM_BY_ID.get(forecast.home);
        const awayTeam = TEAM_BY_ID.get(forecast.away);
        if (!homeTeam || !awayTeam) return null;
        return {
          key,
          forecast,
          result,
          homeTeam,
          awayTeam,
          live: LIVE_RESULTS[key],
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .sort((a, b) => sortKey(a.key, a.forecast).localeCompare(sortKey(b.key, b.forecast)));
  }, []);

  const accuracy = AUDIT._meta.accuracy;

  return (
    <section id="all-predictions" className="mx-auto max-w-[1280px] scroll-mt-28 px-4 py-10 sm:px-6 sm:py-16">
      <header className="mb-5">
        <div className="inline-flex rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald">
          {locale === 'zh' ? '默认预测' : 'Default picks'}
        </div>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-fg-0 sm:text-4xl">
          {locale === 'zh' ? '全部赛程预测' : 'All match predictions'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-2">
          {locale === 'zh'
            ? '不用等待模拟，直接查看每场比赛的赛前预测比分。已结束比赛会显示实际比分和命中结果。'
            : 'See every saved score pick instantly. Finished matches show actual score and hit result.'}
        </p>
        {accuracy.settled_matches > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-bg-1/70 px-3 py-2 font-mono text-xs text-fg-2">
            <span>{locale === 'zh' ? '精确比分命中率' : 'Exact score rate'}</span>
            <span className="text-emerald">
              {accuracy.exact_score_hits}/{accuracy.settled_matches}
            </span>
          </div>
        )}
      </header>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ key, forecast, result, homeTeam, awayTeam, live }) => {
          const done = Boolean(result);
          return (
            <article
              key={key}
              className="rounded-xl border border-border/70 bg-bg-1/72 p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2 font-mono text-[10px] text-fg-3">
                <span>{stageLabel(forecast.stage, key, locale)}</span>
                <span>{formatTime(live?.kickoff_iso)}</span>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Flag code={homeTeam.flag} size={22} />
                    <span className="truncate text-sm font-semibold text-fg-0">
                      {teamDisplayName(homeTeam, locale)}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-display text-2xl font-black text-fg-0 tabular">
                    {forecast.predicted_gh}
                    <span className="mx-1 text-fg-3">-</span>
                    {forecast.predicted_ga}
                  </div>
                  <div className="mt-0.5 flex items-center justify-center gap-1 font-mono text-[9px] text-fg-3">
                    {done ? (
                      result.exact_score_hit ? (
                        <>
                          <CircleCheck className="h-3 w-3 text-emerald" />
                          <span className="text-emerald">{locale === 'zh' ? '命中' : 'Hit'}</span>
                        </>
                      ) : (
                        <>
                          <CircleX className="h-3 w-3 text-rose" />
                          <span className="text-rose">{locale === 'zh' ? '未中' : 'Miss'}</span>
                        </>
                      )
                    ) : (
                      <>
                        <Clock3 className="h-3 w-3" />
                        <span>{locale === 'zh' ? '预测' : 'Pick'}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-end gap-2">
                    <span className="truncate text-right text-sm font-semibold text-fg-0">
                      {teamDisplayName(awayTeam, locale)}
                    </span>
                    <Flag code={awayTeam.flag} size={22} />
                  </div>
                </div>
              </div>

              {done && (
                <div className={cn(
                  'mt-2 rounded-lg border px-2 py-1 text-center font-mono text-[10px]',
                  result.exact_score_hit
                    ? 'border-emerald/30 bg-emerald/10 text-emerald'
                    : 'border-rose/30 bg-rose/10 text-rose',
                )}>
                  {locale === 'zh' ? '实际比分' : 'Actual'} {result.actual_gh}-{result.actual_ga}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
