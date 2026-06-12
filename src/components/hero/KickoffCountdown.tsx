'use client';

import { useEffect, useState } from 'react';
import { Bebas_Neue } from 'next/font/google';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { getCountdownParts, WC2026_KICKOFF_MS, type CountdownParts } from '@/lib/tournament';
import { teamDisplayName } from '@/lib/i18nNames';
import stateData from '@/data/tournament_state.json';
import teamsData from '@/data/teams.json';
import type { Team } from '@/lib/sim/types';

const countdownFont = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
});

const UNITS = ['days', 'hours', 'minutes', 'seconds'] as const;

interface LiveResult {
  home: string;
  away: string;
  status: 'completed' | 'scheduled';
  kickoff_iso?: string;
}

const LIVE_RESULTS = (stateData as { results: Record<string, LiveResult> }).results;
const TEAMS = (teamsData as { teams: Team[] }).teams;
const TEAM_BY_ID = new Map(TEAMS.map((team) => [team.id, team]));

function findNextMatch(nowMs = Date.now()) {
  return Object.values(LIVE_RESULTS)
    .filter((match) => match.status !== 'completed' && match.kickoff_iso)
    .map((match) => ({ match, kickoffMs: Date.parse(match.kickoff_iso!) }))
    .filter(({ kickoffMs }) => kickoffMs > nowMs)
    .sort((a, b) => a.kickoffMs - b.kickoffMs)[0] ?? null;
}

function formatKickoffTime(iso: string | undefined): string {
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

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function Unit({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="flex min-w-[2.75rem] flex-col items-center sm:min-w-[3.25rem]">
      <span
        className={cn(
          countdownFont.className,
          'text-[clamp(2rem,5vw,3.25rem)] leading-none tracking-[0.1em] text-orange-400',
        )}
        style={{ textShadow: '0 0 28px oklch(0.75 0.18 55 / 0.35)' }}
        suppressHydrationWarning
      >
        {value}
      </span>
      <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-orange-400/55 sm:text-[10px]">
        {label}
      </span>
    </div>
  );
}

export function KickoffCountdown({ className }: { className?: string }) {
  const t = useTranslations('countdown');
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  const [nextMatch, setNextMatch] = useState(() => findNextMatch());
  const [parts, setParts] = useState<CountdownParts>(() =>
    getCountdownParts(nextMatch?.kickoffMs ?? WC2026_KICKOFF_MS),
  );

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      const next = findNextMatch();
      setNextMatch(next);
      setParts(getCountdownParts(next?.kickoffMs ?? WC2026_KICKOFF_MS));
    };
    tick();
    const id = window.setInterval(tick, 1_000);
    return () => window.clearInterval(id);
  }, []);

  const values = {
    days: pad(parts.days),
    hours: pad(parts.hours),
    minutes: pad(parts.minutes),
    seconds: pad(parts.seconds),
  };
  const homeTeam = nextMatch ? TEAM_BY_ID.get(nextMatch.match.home) : null;
  const awayTeam = nextMatch ? TEAM_BY_ID.get(nextMatch.match.away) : null;

  return (
    <div
      className={cn('flex flex-col items-center', className)}
      role="timer"
      aria-label={t('aria_label')}
      aria-live="polite"
    >
      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.22em] text-orange-400/65 sm:text-[10px]">
        {nextMatch && homeTeam && awayTeam
          ? locale === 'zh' ? '距离下一场比赛' : 'Next match starts in'
          : t('until_open')}
      </p>

      {mounted ? (
        <div className="flex items-start gap-1 sm:gap-1.5">
          {UNITS.map((unit, i) => (
            <div key={unit} className="flex items-start gap-1 sm:gap-1.5">
              {i > 0 && (
                <span
                  className={cn(
                    countdownFont.className,
                    'mt-0.5 text-[clamp(1.75rem,4vw,2.75rem)] leading-none text-orange-500/40',
                  )}
                  aria-hidden
                >
                  :
                </span>
              )}
              <Unit value={values[unit]} label={t(unit)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-3" aria-hidden>
          {UNITS.map((unit) => (
            <div key={unit} className="flex flex-col items-center gap-1">
              <div className="h-10 w-10 animate-pulse rounded-md bg-orange-500/10 sm:h-12 sm:w-12" />
              <div className="h-2 w-8 animate-pulse rounded bg-orange-500/10" />
            </div>
          ))}
        </div>
      )}

      {nextMatch && homeTeam && awayTeam && (
        <p className="mt-2 max-w-full truncate px-2 text-center font-mono text-[10px] tracking-[0.08em] text-fg-2 sm:text-xs">
          {teamDisplayName(homeTeam, locale)}
          <span className="mx-1 text-fg-3">vs</span>
          {teamDisplayName(awayTeam, locale)}
          <span className="mx-1 text-fg-3">·</span>
          {formatKickoffTime(nextMatch.match.kickoff_iso)}
        </p>
      )}
    </div>
  );
}
