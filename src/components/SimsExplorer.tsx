'use client';

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { cn, formatPct } from '@/lib/utils';
import { Flag } from './Flag';
import { stageDisplayName, teamDisplayName } from '@/lib/i18nNames';
import type { SerializedResult } from '@/lib/sim/worker';
import type { SampleSim } from '@/lib/sim/types';

interface Props {
  teamIdx: number;
  result: SerializedResult;
}

type Outcome =
  | 'champion'
  | 'runnerUp'
  | 'third'
  | 'fourth'
  | 'sf'
  | 'qf'
  | 'r16'
  | 'r32'
  | 'group';

const OUTCOME_ORDER: Outcome[] = ['champion', 'runnerUp', 'third', 'fourth', 'sf', 'qf', 'r16', 'r32', 'group'];
const OUTCOME_LABEL: Record<string, Record<Outcome, string>> = {
  zh: {
    champion: '冠军',
    runnerUp: '亚军',
    third: '季军',
    fourth: '第四名',
    sf: '四强',
    qf: '八强',
    r16: '16 强',
    r32: '32 强',
    group: '小组出局',
  },
  es: {
    champion: 'Campeon',
    runnerUp: 'Subcampeon',
    third: '3er puesto',
    fourth: '4to puesto',
    sf: 'Semis',
    qf: 'Cuartos',
    r16: '16vos',
    r32: '32vos',
    group: 'Fuera en grupos',
  },
  en: {
    champion: 'Champion',
    runnerUp: 'Runner-up',
    third: 'Third place',
    fourth: 'Fourth place',
    sf: 'Semifinalist',
    qf: 'Quarterfinalist',
    r16: 'Round of 16',
    r32: 'Round of 32',
    group: 'Out in groups',
  },
};

const STAGE_ORDER = ['group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final'] as const;

interface TeamMatch {
  stage: typeof STAGE_ORDER[number];
  slotId: string;
  opponentIdx: number;
  gf: number;
  ga: number;
  isHome: boolean;
  result: 'W' | 'L' | 'D';
}

interface TeamPath {
  sim: SampleSim;
  outcome: Outcome;
  matches: TeamMatch[];
}

function outcomeFor(sim: SampleSim, teamIdx: number, highestStage: typeof STAGE_ORDER[number] | null): Outcome {
  if (sim.champion === teamIdx) return 'champion';
  if (sim.runnerUp === teamIdx) return 'runnerUp';
  if (sim.thirdPlace === teamIdx) return 'third';
  if (sim.fourthPlace === teamIdx) return 'fourth';
  if (highestStage === 'sf' || highestStage === 'final') return 'sf';
  if (highestStage === 'qf') return 'qf';
  if (highestStage === 'r16') return 'r16';
  if (highestStage === 'r32') return 'r32';
  return 'group';
}

function buildPath(sim: SampleSim, teamIdx: number): TeamPath {
  const matches: TeamMatch[] = [];
  for (const m of sim.matches) {
    if (m.home !== teamIdx && m.away !== teamIdx) continue;
    const isHome = m.home === teamIdx;
    const gf = isHome ? m.gh : m.ga;
    const ga = isHome ? m.ga : m.gh;
    const opponentIdx = isHome ? m.away : m.home;
    const r: 'W' | 'L' | 'D' = gf > ga ? 'W' : gf < ga ? 'L' : 'D';
    matches.push({ stage: m.stage, slotId: m.slotId, opponentIdx, gf, ga, isHome, result: r });
  }
  matches.sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));
  const highest = matches.length === 0 ? null : matches[matches.length - 1].stage;
  return { sim, outcome: outcomeFor(sim, teamIdx, highest), matches };
}

export function SimsExplorer({ teamIdx, result }: Props) {
  const locale = useLocale();
  const isZh = locale === 'zh';
  const labels = OUTCOME_LABEL[locale] ?? OUTCOME_LABEL.en;
  const paths = useMemo(
    () => result.sampleSims.map((s) => buildPath(s, teamIdx)),
    [result.sampleSims, teamIdx],
  );

  const sampleBuckets = useMemo(() => {
    const map = new Map<Outcome, TeamPath[]>();
    for (const o of OUTCOME_ORDER) map.set(o, []);
    for (const p of paths) map.get(p.outcome)!.push(p);
    return map;
  }, [paths]);

  const fullCounts = useMemo<Record<Outcome, number>>(() => {
    const sc = result.stageCounts;
    const i = teamIdx;
    const n = result.numSimulations;
    const champion = sc.champion[i];
    const reachedFinal = sc.final[i];
    const reachedSF = sc.sf[i];
    const third = sc.third[i];
    const reachedQF = sc.qf[i];
    const reachedR16 = sc.r16[i];
    const reachedR32 = sc.r32[i];
    return {
      champion,
      runnerUp: reachedFinal - champion,
      third,
      fourth: reachedSF - reachedFinal - third,
      sf: 0,
      qf: reachedQF - reachedSF,
      r16: reachedR16 - reachedQF,
      r32: reachedR32 - reachedR16,
      group: n - reachedR32,
    };
  }, [result, teamIdx]);

  const sampleTotal = paths.length;
  const [selected, setSelected] = useState<Outcome | null>(() => {
    for (const o of OUTCOME_ORDER) {
      if ((sampleBuckets.get(o)?.length ?? 0) > 0) return o;
    }
    return null;
  });
  const [expanded, setExpanded] = useState<number | null>(null);

  if (sampleTotal === 0) return null;

  const selectedPaths = selected ? sampleBuckets.get(selected) ?? [] : [];

  return (
    <section>
      <h3 className="mb-3 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-fg-3">
        <span>
          {isZh ? '模拟路径探索' : locale === 'es' ? 'Explorar simulaciones' : 'Explore simulations'}{' '}
          <span className="text-fg-3">
            {isZh
              ? `基于 ${result.numSimulations.toLocaleString()} 次锦标赛模拟`
              : locale === 'es'
                ? `sobre ${result.numSimulations.toLocaleString()} torneos`
                : `across ${result.numSimulations.toLocaleString()} tournaments`}
          </span>
        </span>
      </h3>

      <div className="mb-3 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
        {OUTCOME_ORDER.map((o) => {
          const count = fullCounts[o];
          if (count <= 0) return null;
          const pct = count / result.numSimulations;
          const sample = sampleBuckets.get(o)?.length ?? 0;
          const isSel = selected === o;
          return (
            <button
              key={o}
              onClick={() => { setSelected(o); setExpanded(null); }}
              className={cn(
                'relative overflow-hidden rounded-lg border px-2 py-1.5 text-left transition-colors',
                isSel ? 'border-gold/50 bg-gold/10' : 'border-border bg-bg-2/30 hover:border-border-strong hover:bg-bg-2/50',
              )}
            >
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-fg-3">{labels[o]}</div>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className={cn('font-display text-lg font-bold tabular', isSel ? 'text-gold' : 'text-fg-0')}>
                  {count.toLocaleString()}
                </span>
                <span className="font-mono text-[10px] tabular text-fg-3">{formatPct(pct, 1)}</span>
              </div>
              <div className="mt-0.5 font-mono text-[9px] tabular text-fg-3">
                {sample > 0 ? (isZh ? `${sample} 条样本` : `${sample} sample`) : '-'}
              </div>
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-bg-2/50">
                <div className={cn('h-full', isSel ? 'bg-gold' : 'bg-emerald/60')} style={{ width: `${pct * 100}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="space-y-1.5">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-3">
            {labels[selected]}: {fullCounts[selected].toLocaleString()} {isZh ? '次完整模拟' : 'total sims'}
            <span className="ml-2 text-fg-3">
              {isZh ? ` · 展示 ${selectedPaths.length} 条抽样路径 · 点击查看详情` : ` · ${selectedPaths.length} sampled examples · click for detail`}
            </span>
          </div>
          {selectedPaths.slice(0, 50).map((p, i) => {
            const isExpanded = expanded === p.sim.simIdx;
            return (
              <div
                key={p.sim.simIdx}
                className={cn(
                  'rounded-lg border transition-colors',
                  isExpanded ? 'border-gold/40 bg-bg-2/40' : 'border-border bg-bg-2/20 hover:bg-bg-2/40',
                )}
              >
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left"
                  onClick={() => setExpanded(isExpanded ? null : p.sim.simIdx)}
                >
                  <span className="w-10 font-mono text-[10px] tabular text-fg-3">#{i + 1}</span>
                  <div className="flex-1 overflow-hidden">
                    <PathChain matches={p.matches} teams={result.teams} locale={locale} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border/40 px-3 py-2">
                    <ul className="space-y-1">
                      {p.matches.map((m, idx) => {
                        const opp = result.teams[m.opponentIdx];
                        const tone =
                          m.result === 'W' ? 'text-emerald'
                            : m.result === 'L' ? 'text-rose'
                              : 'text-amber-300';
                        return (
                          <li key={idx} className="flex items-center gap-2 font-mono text-xs">
                            <span className="w-14 text-[9px] uppercase tracking-[0.12em] text-fg-3">
                              {stageDisplayName(m.stage, locale)}
                            </span>
                            <span className="flex items-center gap-1.5 text-fg-2">
                              <Flag code={opp.flag} size={14} />
                              <span>vs {teamDisplayName(opp, locale)}</span>
                            </span>
                            <span className={cn('ml-auto tabular', tone)}>{m.gf}-{m.ga}</span>
                            <span className="w-4 text-center font-mono text-[9px] uppercase">{m.result}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
          {selectedPaths.length > 50 && (
            <p className="pt-1 text-[10px] text-fg-3">
              {isZh ? `还有 ${selectedPaths.length - 50} 条模拟未显示（最多展示 50 条）。` : `${selectedPaths.length - 50} more simulations are hidden (limit 50).`}
            </p>
          )}
        </div>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-fg-3">
        {isZh
          ? `上面的计数来自 ${result.numSimulations.toLocaleString()} 次完整模拟。为了避免保存过大的数据，系统只保留 ${paths.length} 条完整赛程作为可展开样本。`
          : `The counts above are computed from all ${result.numSimulations.toLocaleString()} simulations. The engine keeps ${paths.length} full tournaments as examples so you can inspect individual paths without storing every run.`}
      </p>
    </section>
  );
}

function PathChain({ matches, teams, locale }: { matches: TeamMatch[]; teams: SerializedResult['teams']; locale: string }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
      {matches.map((m, idx) => {
        const opp = teams[m.opponentIdx];
        const tone =
          m.result === 'W' ? 'border-emerald/40 bg-emerald/10 text-emerald'
            : m.result === 'L' ? 'border-rose/40 bg-rose/10 text-rose'
              : 'border-amber-400/40 bg-amber-400/10 text-amber-300';
        return (
          <span
            key={idx}
            className={cn('inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] tabular', tone)}
            title={`${stageDisplayName(m.stage, locale)} · vs ${teamDisplayName(opp, locale)}`}
          >
            <Flag code={opp.flag} size={12} />
            <span>{m.gf}-{m.ga}</span>
          </span>
        );
      })}
    </div>
  );
}
