export type ThemeName = "xp-blue" | "xp-olive" | "xp-silver" | "astronomer" | "mogged";
export type LanguageCode = "en-US" | "es-ES" | "pt-BR";
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type DifficultyKind = "preset" | "custom";
export type GameStatus = "ready" | "playing" | "won" | "lost";
export type OverlayMode = "color" | "percent" | "dots";
export type TouchTapMode = "single-open" | "single-chord";
export type PointerKind = "mouse" | "touch" | "pen" | "keyboard" | "system";
export type GameActionType = "open" | "flag" | "chord" | "new-game" | "restart";
export type GameOutcome = "won" | "lost" | "abandoned";

export interface BoardConfig {
  kind: DifficultyKind;
  key: string;
  columns: number;
  rows: number;
  mines: number;
  presetLevel?: DifficultyLevel;
  classicLabel?: "beginner" | "intermediate" | "expert";
}

export interface DifficultyPreset {
  level: DifficultyLevel;
  columns: number;
  rows: number;
  mines: number;
  classicLabel?: "beginner" | "intermediate" | "expert";
}

export interface CellState {
  index: number;
  x: number;
  y: number;
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacentMines: number;
  exploded: boolean;
}

export interface GameState {
  id: string;
  config: BoardConfig;
  cells: CellState[];
  status: GameStatus;
  seed: number;
  minefieldGenerated: boolean;
  firstRevealIndex: number | null;
  createdAtMs: number;
  startedAtMs: number | null;
  finishedAtMs: number | null;
  elapsedMs: number;
  flagsPlaced: number;
  revealedCount: number;
  moveCount: number;
  restartCount: number;
}

export interface GameMutationResult {
  acted: boolean;
  changedIndices: number[];
  started: boolean;
  minefieldGenerated: boolean;
}

export interface InteractionSettings {
  doubleTapMs: number;
  longPressMs: number;
  dragThresholdPx: number;
  touchTapMode: TouchTapMode;
}

export interface TrainerSettings {
  enabled: boolean;
  overlayMode: OverlayMode;
}

export interface CustomBoardSettings {
  columns: number;
  rows: number;
  mines: number;
}

export interface AppSettings {
  language: LanguageCode;
  theme: ThemeName;
  soundEnabled: boolean;
  selectedDifficultyLevel: DifficultyLevel;
  customBoard: CustomBoardSettings;
  interaction: InteractionSettings;
  trainer: TrainerSettings;
}

export interface NeighborSnapshot {
  direction: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
  x: number | null;
  y: number | null;
  revealed: boolean | null;
  flagged: boolean | null;
  adjacentMines: number | null;
}

export interface GameActionRecord {
  index: number;
  type: GameActionType;
  gesture: string;
  pointerType: PointerKind;
  timestampMs: number;
  elapsedMs: number;
  cell: {
    x: number;
    y: number;
    index: number;
  } | null;
  remainingMinesEstimate: number;
  revealedCount: number;
  flagsPlaced: number;
  trainerEnabled: boolean;
  neighborSnapshot: NeighborSnapshot[];
  changedCells: Array<{
    x: number;
    y: number;
    index: number;
    revealed: boolean;
    flagged: boolean;
    adjacentMines: number;
    exploded: boolean;
  }>;
}

export interface GameRecord {
  id: string;
  createdAtIso: string;
  finishedAtIso: string;
  config: BoardConfig;
  seed: number;
  restartCount: number;
  firstRevealIndex: number | null;
  outcome: GameOutcome;
  durationMs: number;
  moveCount: number;
  actions: GameActionRecord[];
}

export interface StatsBucket {
  key: string;
  games: number;
  wins: number;
  losses: number;
  abandoned: number;
  totalDurationMs: number;
  totalMoves: number;
  fastestWinMs: number | null;
  bestTimesMs: number[];
}

export interface PersistedStats {
  overall: StatsBucket;
  buckets: Record<string, StatsBucket>;
}

export interface TrainerCellProbability {
  probability: number;
  source: "component" | "baseline" | "derived";
}

export interface TrainerModel {
  probabilities: Map<number, TrainerCellProbability>;
  baselineProbability: number;
  unresolvedComponents: number;
}
