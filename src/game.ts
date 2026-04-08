import { DIRECTION_VECTORS } from "./constants";
import type { BoardConfig, CellState, GameMutationResult, GameState } from "./types";

function createSeed(): number {
  const randomBuffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(randomBuffer);
  return randomBuffer[0] || 1;
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let state = Math.imul(value ^ (value >>> 15), value | 1);
    state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

export function indexFor(x: number, y: number, columns: number): number {
  return y * columns + x;
}

export function coordinatesFor(index: number, columns: number): { x: number; y: number } {
  return {
    x: index % columns,
    y: Math.floor(index / columns),
  };
}

export function createGame(config: BoardConfig, nowMs = Date.now()): GameState {
  const totalCells = config.columns * config.rows;
  const cells: CellState[] = Array.from({ length: totalCells }, (_, index) => {
    const { x, y } = coordinatesFor(index, config.columns);
    return {
      index,
      x,
      y,
      mine: false,
      revealed: false,
      flagged: false,
      adjacentMines: 0,
      exploded: false,
    };
  });

  return {
    id: `game-${nowMs}-${Math.random().toString(36).slice(2, 8)}`,
    config,
    cells,
    status: "ready",
    seed: createSeed(),
    firstRevealIndex: null,
    createdAtMs: nowMs,
    startedAtMs: null,
    finishedAtMs: null,
    elapsedMs: 0,
    flagsPlaced: 0,
    revealedCount: 0,
    moveCount: 0,
  };
}

export function getCell(state: GameState, index: number): CellState | null {
  return state.cells[index] ?? null;
}

export function getNeighborIndices(state: GameState, index: number): number[] {
  const cell = state.cells[index];
  if (!cell) {
    return [];
  }

  const neighbors: number[] = [];

  for (const vector of DIRECTION_VECTORS) {
    const neighborX = cell.x + vector.dx;
    const neighborY = cell.y + vector.dy;

    if (
      neighborX < 0 ||
      neighborY < 0 ||
      neighborX >= state.config.columns ||
      neighborY >= state.config.rows
    ) {
      continue;
    }

    neighbors.push(indexFor(neighborX, neighborY, state.config.columns));
  }

  return neighbors;
}

function placeMines(state: GameState, safeIndex: number): void {
  const indices = state.cells.map((cell) => cell.index).filter((index) => index !== safeIndex);
  const random = mulberry32(state.seed);

  for (let currentIndex = indices.length - 1; currentIndex > 0; currentIndex -= 1) {
    const swapIndex = Math.floor(random() * (currentIndex + 1));
    const nextValue = indices[currentIndex];
    indices[currentIndex] = indices[swapIndex];
    indices[swapIndex] = nextValue;
  }

  for (let mineIndex = 0; mineIndex < state.config.mines; mineIndex += 1) {
    state.cells[indices[mineIndex]].mine = true;
  }

  for (const cell of state.cells) {
    if (cell.mine) {
      cell.adjacentMines = 0;
      continue;
    }

    cell.adjacentMines = getNeighborIndices(state, cell.index).reduce((count, neighborIndex) => {
      return count + (state.cells[neighborIndex].mine ? 1 : 0);
    }, 0);
  }
}

function floodReveal(state: GameState, startIndex: number, changedIndices: Set<number>): void {
  const queue = [startIndex];

  while (queue.length > 0) {
    const currentIndex = queue.shift();
    if (currentIndex === undefined) {
      continue;
    }

    const cell = state.cells[currentIndex];
    if (cell.revealed || cell.flagged) {
      continue;
    }

    cell.revealed = true;
    cell.exploded = false;
    state.revealedCount += 1;
    changedIndices.add(currentIndex);

    if (cell.adjacentMines !== 0) {
      continue;
    }

    for (const neighborIndex of getNeighborIndices(state, currentIndex)) {
      const neighbor = state.cells[neighborIndex];
      if (!neighbor.revealed && !neighbor.flagged && !neighbor.mine) {
        queue.push(neighborIndex);
      }
    }
  }
}

function revealAllMines(state: GameState, changedIndices: Set<number>, explodedIndex: number): void {
  for (const cell of state.cells) {
    if (cell.mine && !cell.revealed) {
      cell.revealed = true;
      changedIndices.add(cell.index);
    }

    if (cell.index === explodedIndex) {
      cell.exploded = true;
      changedIndices.add(cell.index);
    }
  }
}

function openHiddenCell(state: GameState, index: number, nowMs: number, changedIndices: Set<number>): boolean {
  const cell = state.cells[index];
  if (!cell || cell.flagged || cell.revealed) {
    return false;
  }

  let generatedMinefield = false;
  if (state.firstRevealIndex === null) {
    state.firstRevealIndex = index;
    state.startedAtMs = nowMs;
    state.status = "playing";
    placeMines(state, index);
    generatedMinefield = true;
  }

  if (cell.mine) {
    cell.revealed = true;
    cell.exploded = true;
    changedIndices.add(index);
    state.status = "lost";
    state.finishedAtMs = nowMs;
    revealAllMines(state, changedIndices, index);
    return generatedMinefield;
  }

  floodReveal(state, index, changedIndices);
  if (state.status === "ready") {
    state.status = "playing";
    state.startedAtMs = nowMs;
  }
  return generatedMinefield;
}

function completeIfCleared(state: GameState, nowMs: number): void {
  const totalSafeCells = state.cells.length - state.config.mines;
  if (state.revealedCount === totalSafeCells) {
    state.status = "won";
    state.finishedAtMs = nowMs;
    for (const cell of state.cells) {
      if (cell.mine && !cell.flagged) {
        cell.flagged = true;
      }
    }
    state.flagsPlaced = state.config.mines;
  }
}

export function revealCell(state: GameState, index: number, nowMs = Date.now()): GameMutationResult {
  if (state.status === "won" || state.status === "lost") {
    return {
      acted: false,
      changedIndices: [],
      started: false,
      minefieldGenerated: false,
    };
  }

  const changedIndices = new Set<number>();
  const wasReady = state.status === "ready";
  const generatedMinefield = openHiddenCell(state, index, nowMs, changedIndices);

  if (changedIndices.size === 0) {
    return {
      acted: false,
      changedIndices: [],
      started: false,
      minefieldGenerated: false,
    };
  }

  if (state.status !== "lost") {
    completeIfCleared(state, nowMs);
  }
  state.moveCount += 1;
  state.elapsedMs = getElapsedMs(state, nowMs);

  return {
    acted: true,
    changedIndices: [...changedIndices],
    started: wasReady,
    minefieldGenerated: generatedMinefield,
  };
}

export function toggleFlag(state: GameState, index: number, nowMs = Date.now()): GameMutationResult {
  if (state.status === "won" || state.status === "lost") {
    return {
      acted: false,
      changedIndices: [],
      started: false,
      minefieldGenerated: false,
    };
  }

  const cell = state.cells[index];
  if (!cell || cell.revealed) {
    return {
      acted: false,
      changedIndices: [],
      started: false,
      minefieldGenerated: false,
    };
  }

  cell.flagged = !cell.flagged;
  state.flagsPlaced += cell.flagged ? 1 : -1;
  state.moveCount += 1;
  state.elapsedMs = getElapsedMs(state, nowMs);

  return {
    acted: true,
    changedIndices: [index],
    started: false,
    minefieldGenerated: false,
  };
}

export function chordCell(state: GameState, index: number, nowMs = Date.now()): GameMutationResult {
  if (state.status !== "playing") {
    return {
      acted: false,
      changedIndices: [],
      started: false,
      minefieldGenerated: false,
    };
  }

  const cell = state.cells[index];
  if (!cell || !cell.revealed || cell.adjacentMines <= 0) {
    return {
      acted: false,
      changedIndices: [],
      started: false,
      minefieldGenerated: false,
    };
  }

  const neighbors = getNeighborIndices(state, index);
  const flaggedNeighbors = neighbors.filter((neighborIndex) => state.cells[neighborIndex].flagged).length;

  if (flaggedNeighbors !== cell.adjacentMines) {
    return {
      acted: false,
      changedIndices: [],
      started: false,
      minefieldGenerated: false,
    };
  }

  const changedIndices = new Set<number>();
  let acted = false;

  for (const neighborIndex of neighbors) {
    const neighbor = state.cells[neighborIndex];
    if (neighbor.flagged || neighbor.revealed) {
      continue;
    }

    acted = true;
    openHiddenCell(state, neighborIndex, nowMs, changedIndices);
    if (state.status === "lost") {
      break;
    }
  }

  if (!acted) {
    return {
      acted: false,
      changedIndices: [],
      started: false,
      minefieldGenerated: false,
    };
  }

  if (state.status !== "lost") {
    completeIfCleared(state, nowMs);
  }
  state.moveCount += 1;
  state.elapsedMs = getElapsedMs(state, nowMs);

  return {
    acted: true,
    changedIndices: [...changedIndices],
    started: false,
    minefieldGenerated: false,
  };
}

export function countRemainingMinesEstimate(state: GameState): number {
  return state.config.mines - state.flagsPlaced;
}

export function getElapsedMs(state: GameState, nowMs = Date.now()): number {
  if (state.startedAtMs === null) {
    return state.elapsedMs;
  }

  if (state.finishedAtMs !== null) {
    return Math.max(0, state.finishedAtMs - state.startedAtMs);
  }

  return Math.max(0, nowMs - state.startedAtMs);
}

export function isOversizedBoard(config: BoardConfig): boolean {
  return config.columns > 30 || config.rows > 16;
}
