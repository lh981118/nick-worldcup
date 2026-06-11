'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import {
  currentAbsences,
  criticality,
  playerPenalty,
  teamPenalty,
  DEFAULT_ABSENCE_WEIGHTS,
  type Absence,
} from '@/lib/sim/absences';

const POSITION_LABEL: Record<string, Record<Absence['position'], string>> = {
  zh: {
    GK: '门将',
    CB: '中后卫',
    FB: '边后卫',
    DM: '防守型中场',
    CM: '中场',
    AM: '前腰',
    WG: '边锋',
    ATT: '前锋',
  },
  es: {
    GK: 'Arquero',
    CB: 'Defensa central',
    FB: 'Lateral',
    DM: 'Mediocampo def.',
    CM: 'Mediocampo',
    AM: 'Mediapunta',
    WG: 'Extremo',
    ATT: 'Delantero',
  },
  en: {
    GK: 'Goalkeeper',
    CB: 'Center back',
    FB: 'Full back',
    DM: 'Defensive mid',
    CM: 'Midfielder',
    AM: 'Attacking mid',
    WG: 'Winger',
    ATT: 'Forward',
  },
};

export function TeamAbsencesPanel({ teamId }: { teamId: string }) {
  const locale = useLocale();
  const isZh = locale === 'zh';
  const positionLabel = POSITION_LABEL[locale] ?? POSITION_LABEL.en;
  const data = useMemo(() => {
    const absences = currentAbsences(teamId);
    if (absences.length === 0) return null;
    const total = teamPenalty(absences, DEFAULT_ABSENCE_WEIGHTS, 'group');
    const rows = absences
      .map((a) => ({
        absence: a,
        criticalityScore: criticality(a, DEFAULT_ABSENCE_WEIGHTS),
        penalty: playerPenalty(a, DEFAULT_ABSENCE_WEIGHTS),
      }))
      .sort((x, y) => x.penalty - y.penalty);
    return { rows, total };
  }, [teamId]);

  if (!data) return null;

  return (
    <section>
      <h3 className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-fg-3">
        <span>
          {isZh ? '当前伤停' : locale === 'es' ? 'Ausencias actuales' : 'Current absences'}{' '}
          <span className="text-fg-3">{isZh ? '· 伤病名单' : locale === 'es' ? '· lesionados' : '· injured players'}</span>
        </span>
        <span className="rounded-md border border-rose/40 bg-rose/10 px-2 py-0.5 text-rose tabular">
          {Math.round(data.total)} ELO
        </span>
      </h3>
      <ul className="space-y-1.5">
        {data.rows.map(({ absence, penalty }) => (
          <li
            key={absence.player}
            className="flex items-center justify-between rounded-lg border border-border bg-bg-2/30 px-3 py-2 text-sm"
          >
            <div className="flex flex-col">
              <span className="text-fg-1">{absence.player}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-fg-3">
                {positionLabel[absence.position]} · €{absence.market_value_mil}m
              </span>
            </div>
            <span className="font-mono text-xs tabular text-rose">{Math.round(penalty)} ELO</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] leading-relaxed text-fg-3">
        {isZh
          ? '这里显示伤停对球队有效 ELO 的扣分。数据来自 Transfermarkt 伤病标记；权重结合球员身价和位置影响。'
          : 'Penalty applied to the team effective ELO in the simulation. Source: Transfermarkt injury flags; weights combine player value and positional impact.'}
      </p>
    </section>
  );
}

export function AbsenceBadge({ teamId, className = '' }: { teamId: string; className?: string }) {
  const total = useMemo(() => {
    const absences = currentAbsences(teamId);
    if (absences.length === 0) return 0;
    return teamPenalty(absences, DEFAULT_ABSENCE_WEIGHTS, 'group');
  }, [teamId]);

  if (total === 0) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border border-rose/40 bg-rose/10 px-1.5 py-0.5 font-mono text-[9px] tabular text-rose ${className}`}
      title={`Absence penalty: ${Math.round(total)} ELO`}
    >
      {Math.round(total)} ELO
    </span>
  );
}
