import { MAX_COUNTER_VALUE } from "./constants";
import type { GameState, PointerKind } from "./types";

export function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }
  return element;
}

export function asPointerKind(value: string): PointerKind {
  if (value === "mouse" || value === "touch" || value === "pen") {
    return value;
  }
  return "system";
}

export function formatCounter(value: number): string {
  const clamped = Math.max(-99, Math.min(MAX_COUNTER_VALUE, Math.trunc(value)));
  if (clamped < 0) {
    return `-${String(Math.abs(clamped)).padStart(2, "0")}`;
  }
  return String(clamped).padStart(3, "0");
}

export function formatDuration(ms: number | null): string {
  if (ms === null) {
    return "—";
  }

  if (ms < 1000) {
    return "0.0s";
  }

  return `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)}s`;
}

export function formatMinutesSeconds(ms: number | null): string {
  if (ms === null) {
    return "—";
  }

  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function clampValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function cloneGameState(state: GameState): GameState {
  return {
    ...state,
    config: { ...state.config },
    cells: state.cells.map((cell) => ({ ...cell })),
  };
}

export function trainerMix(probability: number): string {
  if (probability <= 0) {
    return "var(--trainer-zero)";
  }

  if (probability >= 1) {
    return "var(--trainer-certain)";
  }

  const safeWeight = Math.round((1 - probability) * 100);
  const riskWeight = Math.round(probability * 100);
  return `color-mix(in srgb, var(--trainer-safe) ${safeWeight}%, var(--trainer-risk) ${riskWeight}%)`;
}

export function dotBucket(probability: number): 0 | 1 | 2 | 3 | 4 {
  if (probability <= 0) {
    return 0;
  }
  if (probability >= 1) {
    return 4;
  }
  if (probability < 1 / 3) {
    return 1;
  }
  if (probability < 2 / 3) {
    return 2;
  }
  return 3;
}
