import type {
  AppSettings,
  BoardConfig,
  DifficultyLevel,
  DifficultyPreset,
  InteractionSettings,
  ThemeName,
  TrainerSettings,
} from "./types";

export const MAX_CUSTOM_COLUMNS = 60;
export const MAX_CUSTOM_ROWS = 32;
export const MAX_AUTO_FIT_COLUMNS = 30;
export const MAX_AUTO_FIT_ROWS = 16;
export const MAX_COUNTER_VALUE = 999;
export const TIMER_TICK_MS = 100;
export const DEFAULT_LANGUAGE = "en-US";
export const DEFAULT_THEME: ThemeName = "xp-blue";

export const DEFAULT_INTERACTION_SETTINGS: InteractionSettings = {
  doubleTapMs: 360,
  longPressMs: 380,
  dragThresholdPx: 10,
  touchTapMode: "single-open",
};

export const DEFAULT_TRAINER_SETTINGS: TrainerSettings = {
  enabled: false,
  overlayMode: "color",
};

export const PRESET_DIFFICULTIES: DifficultyPreset[] = [
  { level: 1, columns: 9, rows: 9, mines: 6 },
  { level: 2, columns: 9, rows: 9, mines: 10, classicLabel: "beginner" },
  { level: 3, columns: 16, rows: 16, mines: 24 },
  { level: 4, columns: 16, rows: 16, mines: 32 },
  { level: 5, columns: 16, rows: 16, mines: 40, classicLabel: "intermediate" },
  { level: 6, columns: 30, rows: 16, mines: 72 },
  { level: 7, columns: 30, rows: 16, mines: 86 },
  { level: 8, columns: 30, rows: 16, mines: 99, classicLabel: "expert" },
  { level: 9, columns: 30, rows: 16, mines: 115 },
  { level: 10, columns: 30, rows: 16, mines: 130 },
];

export const DEFAULT_CUSTOM_BOARD = {
  columns: 24,
  rows: 20,
  mines: 99,
};

export const DEFAULT_SETTINGS: AppSettings = {
  language: DEFAULT_LANGUAGE,
  theme: DEFAULT_THEME,
  selectedDifficultyLevel: 2,
  customBoard: DEFAULT_CUSTOM_BOARD,
  interaction: DEFAULT_INTERACTION_SETTINGS,
  trainer: DEFAULT_TRAINER_SETTINGS,
};

export const THEMES: ThemeName[] = ["xp-blue", "xp-olive", "xp-silver", "mogged"];
export const LANGUAGES = ["en-US", "es-ES"] as const;

export const DIRECTION_VECTORS = [
  { dx: 0, dy: -1, key: "n" },
  { dx: 1, dy: -1, key: "ne" },
  { dx: 1, dy: 0, key: "e" },
  { dx: 1, dy: 1, key: "se" },
  { dx: 0, dy: 1, key: "s" },
  { dx: -1, dy: 1, key: "sw" },
  { dx: -1, dy: 0, key: "w" },
  { dx: -1, dy: -1, key: "nw" },
] as const;

export function presetForLevel(level: DifficultyLevel): DifficultyPreset {
  const preset = PRESET_DIFFICULTIES.find((candidate) => candidate.level === level);
  if (!preset) {
    throw new Error(`Unknown difficulty level: ${level}`);
  }
  return preset;
}

export function configForPreset(level: DifficultyLevel): BoardConfig {
  const preset = presetForLevel(level);
  return {
    kind: "preset",
    key: `preset-${preset.level}`,
    columns: preset.columns,
    rows: preset.rows,
    mines: preset.mines,
    presetLevel: preset.level,
    classicLabel: preset.classicLabel,
  };
}

export function configForCustom(columns: number, rows: number, mines: number): BoardConfig {
  return {
    kind: "custom",
    key: `custom-${columns}x${rows}-${mines}`,
    columns,
    rows,
    mines,
  };
}

export function clampCustomBoard(columns: number, rows: number, mines: number): {
  columns: number;
  rows: number;
  mines: number;
} {
  const safeColumns = clamp(Math.round(columns), 8, MAX_CUSTOM_COLUMNS);
  const safeRows = clamp(Math.round(rows), 8, MAX_CUSTOM_ROWS);
  const maxMines = safeColumns * safeRows - 1;
  const safeMines = clamp(Math.round(mines), 1, maxMines);

  return {
    columns: safeColumns,
    rows: safeRows,
    mines: safeMines,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
