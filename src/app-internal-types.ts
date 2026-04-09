import type { GameActionRecord, GameState, PointerKind } from "./types";

export interface CellElements {
  button: HTMLButtonElement;
  value: HTMLSpanElement;
  trainer: HTMLSpanElement;
}

export interface ActiveSession {
  createdAtIso: string;
  actions: GameActionRecord[];
  persisted: boolean;
  statsLocked: boolean;
}

export interface UndoSnapshot {
  game: GameState;
  actionCount: number;
}

export interface PendingTap {
  index: number;
  action: "open" | "chord";
  expiresAt: number;
  timerId: number;
}

export interface PointerSession {
  pointerId: number;
  pointerType: PointerKind;
  cellIndex: number;
  startX: number;
  startY: number;
  startScrollLeft: number;
  startScrollTop: number;
  dragging: boolean;
  longPressTriggered: boolean;
  holdTimerId: number | null;
  hoveringOrigin: boolean;
}

export interface CounterMarquee {
  message: string;
  startedAtMs: number;
}

export interface WindowDragSession {
  pointerId: number;
  startX: number;
  startY: number;
  startLeft: number;
  startTop: number;
}

export interface WindowResizeSession {
  pointerId: number;
  startX: number;
  startY: number;
  startWidth: number;
}
