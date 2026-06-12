import * as fs from 'node:fs';
import * as path from 'node:path';
import { runSimulations } from '../src/lib/sim/engine';

const AUDIT_PATH = path.resolve(__dirname, '..', 'src', 'data', 'prediction_audit.json');
const STATE_PATH = path.resolve(__dirname, '..', 'src', 'data', 'tournament_state.json');

type Stage = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final' | '3rd';

interface LiveResult {
  stage: Stage;
  home: string;
  away: string;
  gh: number;
  ga: number;
  status: 'completed' | 'scheduled';
  kickoff_iso?: string;
}

interface StateFile {
  results: Record<string, LiveResult>;
}

interface Forecast {
  stage: Stage;
  home: string;
  away: string;
  predicted_gh: number;
  predicted_ga: number;
  forecasted_at: string;
}

interface SettledResult extends Forecast {
  actual_gh: number;
  actual_ga: number;
  exact_score_hit: boolean;
  outcome_hit: boolean;
  settled_at: string;
}

interface AuditFile {
  _meta: {
    purpose: string;
    updated_at: string;
    accuracy: {
      exact_score_hits: number;
      settled_matches: number;
      exact_score_rate: number;
    };
  };
  forecasts: Record<string, Forecast>;
  results: Record<string, SettledResult>;
}

function loadAudit(): AuditFile {
  return JSON.parse(fs.readFileSync(AUDIT_PATH, 'utf-8')) as AuditFile;
}

function loadState(): StateFile {
  return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8')) as StateFile;
}

function saveAudit(audit: AuditFile): void {
  const settled = Object.values(audit.results);
  const hits = settled.filter((r) => r.exact_score_hit).length;
  audit._meta.updated_at = new Date().toISOString();
  audit._meta.accuracy = {
    exact_score_hits: hits,
    settled_matches: settled.length,
    exact_score_rate: settled.length > 0 ? Math.round((hits / settled.length) * 10000) / 10000 : 0,
  };
  fs.writeFileSync(AUDIT_PATH, JSON.stringify(audit, null, 2) + '\n');
}

function outcome(gh: number, ga: number): 'home' | 'draw' | 'away' {
  if (gh > ga) return 'home';
  if (gh < ga) return 'away';
  return 'draw';
}

function modalScore(scoreHist: ArrayLike<number>): { gh: number; ga: number } {
  let bestIdx = 0;
  let bestCount = -1;
  for (let i = 0; i < scoreHist.length; i++) {
    if (scoreHist[i] > bestCount) {
      bestCount = scoreHist[i];
      bestIdx = i;
    }
  }
  return { gh: Math.floor(bestIdx / 8), ga: bestIdx % 8 };
}

function shouldRefreshForecast(existing: Forecast | undefined, live: LiveResult | undefined, now: Date): boolean {
  if (!existing) return !live?.kickoff_iso || new Date(live.kickoff_iso) > now;
  if (!live?.kickoff_iso) return true;
  return new Date(live.kickoff_iso) > now;
}

function main() {
  const args = process.argv.slice(2);
  const nIndex = args.indexOf('--n');
  const numSimulations = nIndex >= 0 && args[nIndex + 1] ? parseInt(args[nIndex + 1], 10) : 20000;
  const now = new Date();
  const audit = loadAudit();
  const state = loadState();

  for (const [key, live] of Object.entries(state.results)) {
    if (live.status !== 'completed') continue;
    if (audit.results[key]) continue;
    const forecast = audit.forecasts[key];
    if (!forecast) continue;
    audit.results[key] = {
      ...forecast,
      actual_gh: live.gh,
      actual_ga: live.ga,
      exact_score_hit: forecast.predicted_gh === live.gh && forecast.predicted_ga === live.ga,
      outcome_hit: outcome(forecast.predicted_gh, forecast.predicted_ga) === outcome(live.gh, live.ga),
      settled_at: now.toISOString(),
    };
  }

  const sim = runSimulations({
    numSimulations,
    seed: 20260611,
    progressEvery: numSimulations + 1,
  });

  const bestBySlot = new Map<string, Forecast & { count: number }>();
  for (const [key, fixture] of sim.fixtures) {
    const slotKey = fixture.stage === 'group' ? fixture.slotId : key.split('|')[0];
    const live = state.results[slotKey];
    if (live?.status === 'completed') continue;
    if (!shouldRefreshForecast(audit.forecasts[slotKey], live, now)) continue;
    const score = modalScore(fixture.scoreHist);
    const candidate = {
      stage: fixture.stage,
      home: fixture.home,
      away: fixture.away,
      predicted_gh: score.gh,
      predicted_ga: score.ga,
      forecasted_at: now.toISOString(),
      count: fixture.count,
    };
    const existing = bestBySlot.get(slotKey);
    if (!existing || candidate.count > existing.count) bestBySlot.set(slotKey, candidate);
  }

  for (const [key, forecast] of bestBySlot) {
    const { count: _count, ...saved } = forecast;
    audit.forecasts[key] = saved;
  }

  saveAudit(audit);
  console.log(`prediction audit: ${audit._meta.accuracy.exact_score_hits}/${audit._meta.accuracy.settled_matches} exact score hits`);
}

main();
