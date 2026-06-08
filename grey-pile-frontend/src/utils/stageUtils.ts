import { Stage, StageCounts, Stats, StageCount } from '../types';

export const STAGE_ORDER: Stage[] = ['unbuilt', 'built', 'primed', 'base', 'painted'];

// Normalises whatever case the API returns ("Unbuilt", "UNBUILT", "unbuilt") to the
// lowercase Stage union used throughout the app.
export const normalizeStage = (s: string): Stage => s.toLowerCase() as Stage;

export const stageIndex = (stage: Stage): number => STAGE_ORDER.indexOf(stage);

export const nextStage = (stage: Stage): Stage =>
  STAGE_ORDER[Math.min(stageIndex(stage) + 1, STAGE_ORDER.length - 1)];

export function computeStageCounts(models: { stage: Stage }[]): StageCounts {
  return {
    unbuilt: models.filter(m => m.stage === 'unbuilt').length,
    built:   models.filter(m => m.stage === 'built').length,
    primed:  models.filter(m => m.stage === 'primed').length,
    base:    models.filter(m => m.stage === 'base').length,
    painted: models.filter(m => m.stage === 'painted').length,
  };
}

// Weighted average across stage indices (0–4), matches the backend formula
export function computeCompletionPct(models: { stage: Stage }[]): number {
  if (models.length === 0) return 0;
  const sum = models.reduce((acc, m) => acc + stageIndex(m.stage), 0);
  return Math.round((sum / (4 * models.length)) * 1000) / 10;
}

export function computeStats(models: { stage: Stage }[]): Stats {
  const perStage: StageCount[] = STAGE_ORDER.map(stage => ({
    stage,
    count: models.filter(m => m.stage === stage).length,
  }));

  return {
    total:   models.length,
    perStage,
    painted: models.filter(m => m.stage === 'painted').length,
    wip:     models.filter(m => ['built', 'primed', 'base'].includes(m.stage)).length,
    pile:    models.filter(m => m.stage === 'unbuilt').length,
  };
}
