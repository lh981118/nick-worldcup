'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { BarChart3 } from 'lucide-react';
import { fireConfetti } from '@/lib/confetti';
import { useSimulation } from '@/hooks/useSimulation';
import { Hero } from './Hero';
import { SimulationControls } from './SimulationControls';
import { ChampionProbBar } from './ChampionProbBar';
import { StageMatrix } from './StageMatrix';
import { GroupCards } from './GroupCards';
import { BracketTree } from './BracketTree';
import { GoalStats } from './GoalStats';
import { SurpriseCards } from './SurpriseCards';
import { MatchCalendar } from './MatchCalendar';
import { TournamentStats } from './TournamentStats';
import { MarketEdge } from './MarketEdge';
import { PredictionDelta } from './PredictionDelta';
import { TeamDetailDrawer } from './TeamDetailDrawer';
import { MatchDetailDrawer } from './MatchDetailDrawer';
import { SectionNav } from './layout/SectionNav';
import { DefaultPredictionCalendar } from './DefaultPredictionCalendar';

export function Dashboard() {
  const { state, run } = useSimulation();
  const router = useRouter();
  const lastStatus = useRef(state.status);

  useEffect(() => {
    if (state.result) {
      router.prefetch('/demo');
      void import('@/lib/demo/cache').then(({ scheduleDemoWarm, preloadDemoRoute }) => {
        scheduleDemoWarm(state.result!);
        preloadDemoRoute();
      });
    }
  }, [state.result, router]);

  useEffect(() => {
    if (state.status === 'done' && lastStatus.current !== 'done') {
      fireConfetti();
      setTimeout(() => {
        document.getElementById('champion')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
    }
    lastStatus.current = state.status;
  }, [state.status]);

  return (
    <div className="relative">
      <Hero state={state} />

      <section id="analysis" className="mx-auto max-w-[1280px] scroll-mt-28 px-4 py-10 sm:px-6 sm:py-16">
        <div className="relative overflow-hidden rounded-2xl border border-gold/25 bg-bg-0/78 p-4 shadow-[0_28px_80px_-36px_rgba(245,158,11,0.55)] backdrop-blur-xl sm:p-6">
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background:
                'linear-gradient(135deg, oklch(0.82 0.15 82 / 0.18), transparent 46%), radial-gradient(circle at 85% 0%, oklch(0.70 0.16 180 / 0.18), transparent 36%)',
            }}
            aria-hidden
          />
          <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.65fr)] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
                <BarChart3 className="h-3.5 w-3.5" />
                深度模拟
              </div>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-fg-0 sm:text-4xl">
                夺冠概率与晋级路径
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-2">
                默认首页直接展示比分预测；如果想看冠军概率、小组出线、淘汰赛路径和统计图表，可以在这里手动启动完整模型。
              </p>
              {state.result && (
                <p className="mt-3 rounded-xl border border-emerald/25 bg-emerald/10 px-3 py-2 text-xs text-emerald">
                  模拟已生成，继续向下可以查看夺冠概率、分组路径和完整赛程分析。
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-bg-1/70 p-3 sm:p-4">
              <SimulationControls state={state} onRun={run} />
            </div>
          </div>
        </div>
      </section>

      <DefaultPredictionCalendar />

      {state.result && (
        <>
          <SectionNav />

          <div id="resumen" className="scroll-mt-32">
            <PredictionDelta result={state.result} />
            <ChampionProbBar result={state.result} resultNoAbsences={state.resultNoAbsences} />
            <StageMatrix result={state.result} />
          </div>

          <div id="grupos" className="scroll-mt-32">
            <GroupCards result={state.result} />
          </div>

          <div id="bracket" className="scroll-mt-32">
            <BracketTree result={state.result} />
          </div>

          <div id="calendario" className="scroll-mt-32">
            <MatchCalendar result={state.result} />
          </div>

          <div id="stats" className="scroll-mt-32">
            <TournamentStats result={state.result} />
            <GoalStats result={state.result} />
            <SurpriseCards result={state.result} />
          </div>

          <MarketEdge result={state.result} />

          <TeamDetailDrawer result={state.result} resultNoAbsences={state.resultNoAbsences} />
          <MatchDetailDrawer result={state.result} />
        </>
      )}
    </div>
  );
}
