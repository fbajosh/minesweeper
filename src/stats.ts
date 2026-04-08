import { DEFAULT_SETTINGS } from "./constants";
import type { BoardConfig, GameRecord, PersistedStats, StatsBucket } from "./types";

const SETTINGS_STORAGE_KEY = "minesweeper-trainer-settings";
const STATS_STORAGE_KEY = "minesweeper-trainer-stats";

function createEmptyBucket(key: string): StatsBucket {
  return {
    key,
    games: 0,
    wins: 0,
    losses: 0,
    abandoned: 0,
    totalDurationMs: 0,
    totalMoves: 0,
    fastestWinMs: null,
    bestTimesMs: [],
  };
}

function bucketKeyForConfig(config: BoardConfig): string {
  return config.key;
}

export function readStoredSettings() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      customBoard: {
        ...DEFAULT_SETTINGS.customBoard,
        ...(parsed?.customBoard ?? {}),
      },
      interaction: {
        ...DEFAULT_SETTINGS.interaction,
        ...(parsed?.interaction ?? {}),
      },
      trainer: {
        ...DEFAULT_SETTINGS.trainer,
        ...(parsed?.trainer ?? {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeStoredSettings(settings: unknown): void {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage failures and keep the app playable.
  }
}

export function readStoredStats(): PersistedStats {
  try {
    const raw = window.localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) {
      return {
        overall: createEmptyBucket("overall"),
        buckets: {},
      };
    }

    const parsed = JSON.parse(raw) as PersistedStats;
    return {
      overall: {
        ...createEmptyBucket("overall"),
        ...(parsed?.overall ?? {}),
      },
      buckets: typeof parsed?.buckets === "object" && parsed.buckets ? parsed.buckets : {},
    };
  } catch {
    return {
      overall: createEmptyBucket("overall"),
      buckets: {},
    };
  }
}

export function writeStoredStats(stats: PersistedStats): void {
  try {
    window.localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage failures and keep the app playable.
  }
}

function applyRecordToBucket(bucket: StatsBucket, record: GameRecord): StatsBucket {
  const nextBucket: StatsBucket = {
    ...bucket,
    games: bucket.games + 1,
    totalDurationMs: bucket.totalDurationMs + record.durationMs,
    totalMoves: bucket.totalMoves + record.moveCount,
  };

  if (record.outcome === "won") {
    nextBucket.wins += 1;
    nextBucket.fastestWinMs =
      nextBucket.fastestWinMs === null ? record.durationMs : Math.min(nextBucket.fastestWinMs, record.durationMs);
    nextBucket.bestTimesMs = [...nextBucket.bestTimesMs, record.durationMs].sort((left, right) => left - right).slice(0, 5);
  } else if (record.outcome === "lost") {
    nextBucket.losses += 1;
  } else {
    nextBucket.abandoned += 1;
  }

  return nextBucket;
}

export function recordFinishedGame(stats: PersistedStats, record: GameRecord): PersistedStats {
  if (record.restartCount > 0) {
    return stats;
  }

  const key = bucketKeyForConfig(record.config);
  const existingBucket = stats.buckets[key] ?? createEmptyBucket(key);

  return {
    overall: applyRecordToBucket(stats.overall, record),
    buckets: {
      ...stats.buckets,
      [key]: applyRecordToBucket(existingBucket, record),
    },
  };
}

export function statsBucketForConfig(stats: PersistedStats, config: BoardConfig): StatsBucket | null {
  return stats.buckets[config.key] ?? null;
}
