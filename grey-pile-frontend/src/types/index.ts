// ─── Enums ────────────────────────────────────────────────────────────────────

export type Stage =
  | 'unbuilt'
  | 'built'
  | 'primed'
  | 'base'
  | 'painted';

export type PaintType =
  | 'base'
  | 'layer'
  | 'wash'
  | 'metallic'
  | 'texture';

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface Faction {
  id: number;
  name: string;
  blurb?: string;
  accent?: string;   // hex colour e.g. #caa15a
  tint?: string;     // hex colour for background tint
  units: Unit[];
}

export interface Unit {
  id: number;
  factionId: number;
  name: string;
  photoUrl?: string;
  modelCount: number;
  stageCounts: StageCounts;
  completionPct: number;
}

// Full unit detail — fetched when opening a unit from the Roster
export interface UnitDetail {
  id: number;
  factionId: number;
  factionName: string;
  name: string;
  photoUrl?: string;
  modelCount: number;
  models: Model[];
  progress: Stage[];
  completionPct: number;
}

export interface Model {
  id: number;
  unitId: number;
  stage: Stage;
  photoUrl?: string;
  notes?: string;
  recipeId?: number;
}

export interface Paint {
  id: number;
  name: string;
  hex: string;
  type: PaintType;
  isFavourite: boolean;
  partnerId?: number;
}

export interface RecipePart {
  id: number;
  recipeId: number;
  paintId: number;
  sortOrder: number;
}

export interface Recipe {
  id: number;
  name: string;
  note?: string;
  factionId?: number;
  parts: RecipePart[];
}

export interface Event {
  id: number;
  name: string;
  shortName: string;
  venue?: string;
  eventDate: string;   // ISO date string e.g. "2025-06-15"
  scope: string;
  modelsNeeded: number;
  color: string;       // hex — terracotta / sage / lilac per event type
  unitIds: number[];   // units from the roster committed to this event
}

export interface JournalEntry {
  id: number;
  modelId: number;
  fromStage?: Stage;
  toStage: Stage;
  advancedAt: string;  // ISO timestamp
}

// ─── Derived / query shapes ───────────────────────────────────────────────────

export interface StageCounts {
  unbuilt: number;
  built: number;
  primed: number;
  base: number;
  painted: number;
}

export interface StageCount {
  stage: Stage;
  count: number;
}

export interface Stats {
  total: number;
  perStage: StageCount[];
  painted: number;
  wip: number;    // built + primed + base
  pile: number;   // unbuilt
}
