'use client';

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { Flag } from './Flag';
import { cn, formatPct } from '@/lib/utils';
import { stageDisplayName, teamDisplayName } from '@/lib/i18nNames';
import { useSelection } from '@/hooks/useSelection';
import auditData from '@/data/prediction_audit.json';
import type { SerializedResult } from '@/lib/sim/worker';

interface Props { result: SerializedResult; }

interface Row {
  key: string;
  stage: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final' | '3rd';
  stageLabel: string;
  group?: string;
  homeId: string;
  awayId: string;
  homeName: string;
  awayName: string;
  homeFlag: string;
  awayFlag: string;
  modalScore: string;
  winsHome: number;
  draws: number;
  winsAway: number;
  matchupProb: number;
  expectedGoals: number;
  audit?: {
    predictedScore: string;
    actualScore: string;
    exactScoreHit: boolean;
  };
}

interface PredictionAuditFile {
  _meta: {
    accuracy: {
      exact_score_hits: number;
      settled_matches: number;
      exact_score_rate: number;
    };
  };
  results: Record<string, {
    predicted_gh: number;
    predicted_ga: number;
    actual_gh: number;
    actual_ga: number;
    exact_score_hit: boolean;
  }>;
}

const AUDIT = auditData as PredictionAuditFile;

const STAGE_ORDER: Row['stage'][] = ['group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final'];

const STAGE_LABELS: Record<string, Record<Row['stage'], string>> = {
  zh: {
    group: '小组赛',
    r32: '32 强',
    r16: '16 强',
    qf: '8 强',
    sf: '半决赛',
    final: '决赛',
    '3rd': '三四名决赛',
  },
  es: {
    group: 'Grupos',
    r32: 'R32',
    r16: 'R16',
    qf: 'Cuartos',
    sf: 'Semifinal',
    final: 'Final',
    '3rd': '3er puesto',
  },
  en: {
    group: 'Groups',
    r32: 'R32',
    r16: 'R16',
    qf: 'Quarterfinals',
    sf: 'Semifinals',
    final: 'Final',
    '3rd': '3rd place',
  },
};

const COPY = {
  zh: {
    title: '赛程日历 · 104 场比赛',
    subtitle: '每场比赛包含最可能比分、胜平负概率和预期进球。点击任意行查看完整比分分布、射手和角球。',
    all: '全部',
    groups: '小组赛',
    teamAll: '全部球队',
    stage: '阶段',
    home: '主队',
    score: '比分',
    away: '客队',
    homeWin: '主胜',
    draw: '平',
    awayWin: '客胜',
    goals: '进球',
    matchup: '对阵概率',
    note: '淘汰赛只展示每个位置最可能出现的对阵。对阵概率表示该具体交锋发生的概率，其余概率分布在其他可能对阵中。',
  },
  es: {
    title: 'Calendario · 104 partidos',
    subtitle: 'Cada partido con su resultado modal, probabilidades W/D/L y goles esperados. Click en una fila para ver la distribución completa, anotadores y córners.',
    all: 'Todos',
    groups: 'Grupos',
    teamAll: 'Todos los equipos',
    stage: 'Etapa',
    home: 'Local',
    score: 'Score',
    away: 'Visitante',
    homeWin: 'L',
    draw: 'E',
    awayWin: 'V',
    goals: 'Goles',
    matchup: 'P(matchup)',
    note: 'En eliminatoria mostramos el matchup más probable por slot. P(matchup) indica la probabilidad de que ese cruce específico ocurra; el resto se reparte entre matchups alternativos.',
  },
  en: {
    title: 'Calendar · 104 matches',
    subtitle: 'Each match includes modal score, W/D/L probabilities, and expected goals. Click any row for the full score distribution, scorers, and corners.',
    all: 'All',
    groups: 'Groups',
    teamAll: 'All teams',
    stage: 'Stage',
    home: 'Home',
    score: 'Score',
    away: 'Away',
    homeWin: 'H',
    draw: 'D',
    awayWin: 'A',
    goals: 'Goals',
    matchup: 'P(matchup)',
    note: 'For knockouts we show the most likely matchup per slot. P(matchup) is the probability of that exact pairing; the rest is split across alternate matchups.',
  },
};

export function MatchCalendar({ result }: Props) {
  const locale = useLocale();
  const lang = locale === 'zh' || locale === 'es' ? locale : 'en';
  const copy = COPY[lang];
  const labels = STAGE_LABELS[lang];
  const openFixture = useSelection((s) => s.openFixture);
  const [stageFilter, setStageFilter] = useState<Row['stage'] | 'all'>('all');
  const [teamFilter, setTeamFilter] = useState<string>('');

  const teamById = useMemo(() => new Map(result.teams.map((t) => [t.id, t])), [result]);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    for (const [key, f] of result.fixtures) {
      const homeTeam = teamById.get(f.home);
      const awayTeam = teamById.get(f.away);
      if (!homeTeam || !awayTeam) continue;

      let bestIdx = 0; let bestC = 0;
      for (let i = 0; i < 64; i++) {
        if (f.scoreHist[i] > bestC) { bestC = f.scoreHist[i]; bestIdx = i; }
      }
      const h = Math.floor(bestIdx / 8);
      const a = bestIdx % 8;
      const audit = AUDIT.results[key];

      out.push({
        key,
        stage: f.stage,
        stageLabel: labels[f.stage],
        group: f.group,
        homeId: f.home,
        awayId: f.away,
        homeName: teamDisplayName(homeTeam, locale),
        awayName: teamDisplayName(awayTeam, locale),
        homeFlag: homeTeam.flag,
        awayFlag: awayTeam.flag,
        modalScore: `${h}-${a}`,
        winsHome: f.count > 0 ? f.winsHome / f.count : 0,
        draws: f.count > 0 ? f.draws / f.count : 0,
        winsAway: f.count > 0 ? f.winsAway / f.count : 0,
        matchupProb: f.count / result.numSimulations,
        expectedGoals: f.count > 0 ? (f.sumGoalsHome + f.sumGoalsAway) / f.count : 0,
        audit: audit
          ? {
              predictedScore: `${audit.predicted_gh}-${audit.predicted_ga}`,
              actualScore: `${audit.actual_gh}-${audit.actual_ga}`,
              exactScoreHit: audit.exact_score_hit,
            }
          : undefined,
      });
    }

    const bySlot = new Map<string, Row>();
    const groupRows: Row[] = [];
    for (const r of out) {
      if (r.stage === 'group') {
        groupRows.push(r);
        continue;
      }
      const slotId = r.key.split('|')[0];
      const existing = bySlot.get(slotId);
      if (!existing || r.matchupProb > existing.matchupProb) {
        bySlot.set(slotId, r);
      }
    }
    return [...groupRows, ...Array.from(bySlot.values())];
  }, [labels, locale, result, teamById]);

  const filtered = useMemo(() => {
    let r = rows;
    if (stageFilter !== 'all') r = r.filter((x) => x.stage === stageFilter);
    if (teamFilter) r = r.filter((x) => x.homeId === teamFilter || x.awayId === teamFilter);
    return [...r].sort((a, b) => {
      const sA = STAGE_ORDER.indexOf(a.stage);
      const sB = STAGE_ORDER.indexOf(b.stage);
      if (sA !== sB) return sA - sB;
      if (a.stage === 'group') return a.key.localeCompare(b.key);
      return parseInt(a.key.split('|')[0], 10) - parseInt(b.key.split('|')[0], 10);
    });
  }, [rows, stageFilter, teamFilter]);

  const stages: Array<{ k: Row['stage'] | 'all'; label: string }> = [
    { k: 'all', label: copy.all },
    { k: 'group', label: copy.groups },
    { k: 'r32', label: stageDisplayName('r32', locale) },
    { k: 'r16', label: stageDisplayName('r16', locale) },
    { k: 'qf', label: stageDisplayName('qf', locale) },
    { k: 'sf', label: stageDisplayName('sf', locale) },
    { k: 'final', label: stageDisplayName('final', locale) },
  ];

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 sm:py-20">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-fg-0 sm:text-4xl lg:text-5xl">
            {copy.title}
          </h2>
          <p className="mt-2 text-sm text-fg-2">{copy.subtitle}</p>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {AUDIT._meta.accuracy.settled_matches > 0 && (
          <div className="mr-auto flex w-full flex-wrap items-center gap-2 rounded-2xl border border-emerald/30 bg-emerald/10 px-3 py-2 text-xs text-fg-1 sm:w-auto">
            <span className="font-mono uppercase tracking-[0.14em] text-emerald">
              {locale === 'zh' ? '预测命中率' : 'Prediction accuracy'}
            </span>
            <span>{locale === 'zh' ? '精确比分' : 'Exact score'}</span>
            <span className="font-mono font-bold tabular text-fg-0">
              {AUDIT._meta.accuracy.exact_score_hits}/{AUDIT._meta.accuracy.settled_matches}
            </span>
            <span className="font-mono tabular text-emerald">
              {formatPct(AUDIT._meta.accuracy.exact_score_rate, 1)}
            </span>
          </div>
        )}
        {stages.map((s) => (
          <button
            key={s.k}
            onClick={() => setStageFilter(s.k)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              stageFilter === s.k
                ? 'border-gold/40 bg-gold/10 text-gold'
                : 'border-border bg-bg-1/30 text-fg-2 hover:text-fg-1',
            )}
          >
            {s.label}
          </button>
        ))}
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="mt-1 w-full rounded-full border border-border bg-bg-1/40 px-3 py-1.5 text-xs text-fg-1 sm:ml-auto sm:mt-0 sm:w-auto"
        >
          <option value="">{copy.teamAll}</option>
          {result.teams.map((t) => (
            <option key={t.id} value={t.id}>{teamDisplayName(t, locale)}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border glass">
        <table className="min-w-full">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.18em] text-fg-3 font-mono">
              <th className="px-4 py-3 text-left">{copy.stage}</th>
              <th className="px-4 py-3 text-right">{copy.home}</th>
              <th className="px-2 py-3 text-center">{copy.score}</th>
              <th className="px-4 py-3 text-left">{copy.away}</th>
              <th className="px-3 py-3 text-center">{copy.homeWin}</th>
              <th className="px-3 py-3 text-center">{copy.draw}</th>
              <th className="px-3 py-3 text-center">{copy.awayWin}</th>
              <th className="px-3 py-3 text-right">{copy.goals}</th>
              <th className="px-3 py-3 text-right">{copy.matchup}</th>
              <th className="px-3 py-3 text-center">{locale === 'zh' ? '命中' : 'Hit'}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.key}
                onClick={() => openFixture(r.key)}
                className="cursor-pointer border-t border-border/40 transition-colors hover:bg-bg-2/40"
              >
                <td className="px-4 py-2.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-3">
                    {r.stageLabel}{r.group && ` ${r.group}`}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm text-fg-1">{r.homeName}</span>
                    <Flag code={r.homeFlag} size={18} />
                  </div>
                </td>
                <td className="px-2 py-2.5 text-center">
                  <span className="font-mono text-sm tabular text-fg-0">{r.modalScore}</span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Flag code={r.awayFlag} size={18} />
                    <span className="text-sm text-fg-1">{r.awayName}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center font-mono text-xs tabular text-emerald">
                  {formatPct(r.winsHome, 0)}
                </td>
                <td className="px-3 py-2.5 text-center font-mono text-xs tabular text-fg-2">
                  {formatPct(r.draws, 0)}
                </td>
                <td className="px-3 py-2.5 text-center font-mono text-xs tabular text-violet">
                  {formatPct(r.winsAway, 0)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-xs tabular text-fg-0">
                  {r.expectedGoals.toFixed(1)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-xs tabular text-fg-3">
                  {r.stage === 'group' ? '100%' : formatPct(r.matchupProb, 1)}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {r.audit ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className={cn(
                          'inline-flex h-6 w-6 items-center justify-center rounded-full border font-mono text-sm font-bold',
                          r.audit.exactScoreHit
                            ? 'border-emerald/50 bg-emerald/15 text-emerald'
                            : 'border-rose/50 bg-rose/15 text-rose',
                        )}
                        title={`${locale === 'zh' ? '预测' : 'Pred'} ${r.audit.predictedScore} · ${locale === 'zh' ? '实际' : 'Actual'} ${r.audit.actualScore}`}
                      >
                        {r.audit.exactScoreHit ? '√' : '×'}
                      </span>
                      <span className="font-mono text-[9px] text-fg-3">
                        {r.audit.predictedScore}/{r.audit.actualScore}
                      </span>
                    </div>
                  ) : (
                    <span className="text-fg-3">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[10px] text-fg-3">{copy.note}</p>
    </section>
  );
}
