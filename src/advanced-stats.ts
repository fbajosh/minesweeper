import { getElapsedMs, getNeighborIndices } from "./game";
import type { GameState } from "./types";

export interface ClickStats {
  totalClicks: number;
  effectiveClicks: number;
}

export interface AdvancedStatsMetrics {
  elapsedSeconds: number;
  totalClicks: number;
  effectiveClicks: number;
  cps: number | null;
  threeBv: number | null;
  threeBvPerSecond: number | null;
  ios: number | null;
  rqp: number | null;
  ioe: number | null;
  correctness: number | null;
  throughput: number | null;
  zini: number | null;
}

export function computeBoard3BV(game: GameState): number | null {
  if (!game.minefieldGenerated) {
    return null;
  }

  const visitedZeros = new Set<number>();
  const coveredByOpening = new Set<number>();
  let openings = 0;

  for (const cell of game.cells) {
    if (cell.mine || cell.adjacentMines !== 0 || visitedZeros.has(cell.index)) {
      continue;
    }

    openings += 1;
    const zeroComponent: number[] = [];
    const queue = [cell.index];
    visitedZeros.add(cell.index);

    while (queue.length > 0) {
      const currentIndex = queue.shift();
      if (currentIndex === undefined) {
        continue;
      }

      zeroComponent.push(currentIndex);

      for (const neighborIndex of getNeighborIndices(game, currentIndex)) {
        const neighbor = game.cells[neighborIndex];
        if (neighbor.mine || neighbor.adjacentMines !== 0 || visitedZeros.has(neighborIndex)) {
          continue;
        }

        visitedZeros.add(neighborIndex);
        queue.push(neighborIndex);
      }
    }

    for (const zeroIndex of zeroComponent) {
      coveredByOpening.add(zeroIndex);
      for (const neighborIndex of getNeighborIndices(game, zeroIndex)) {
        if (!game.cells[neighborIndex].mine) {
          coveredByOpening.add(neighborIndex);
        }
      }
    }
  }

  const isolatedSafeCells = game.cells.filter((cell) => !cell.mine && !coveredByOpening.has(cell.index)).length;
  return openings + isolatedSafeCells;
}

export function computeAdvancedStats(game: GameState, clicks: ClickStats, nowMs = Date.now()): AdvancedStatsMetrics {
  const elapsedSeconds = getElapsedMs(game, nowMs) / 1000;
  const threeBv = computeBoard3BV(game);
  const cps = elapsedSeconds > 0 ? clicks.totalClicks / elapsedSeconds : null;
  const threeBvPerSecond = threeBv !== null && elapsedSeconds > 0 ? threeBv / elapsedSeconds : null;
  const ios = threeBv !== null && threeBv > 1 && elapsedSeconds > 1 ? Math.log(threeBv) / Math.log(elapsedSeconds) : null;
  const rqp = threeBvPerSecond !== null && threeBvPerSecond > 0 ? elapsedSeconds / threeBvPerSecond : null;
  const ioe = threeBv !== null && clicks.totalClicks > 0 ? threeBv / clicks.totalClicks : null;
  const correctness = clicks.totalClicks > 0 ? clicks.effectiveClicks / clicks.totalClicks : null;
  const throughput = threeBv !== null && clicks.effectiveClicks > 0 ? threeBv / clicks.effectiveClicks : null;

  return {
    elapsedSeconds,
    totalClicks: clicks.totalClicks,
    effectiveClicks: clicks.effectiveClicks,
    cps,
    threeBv,
    threeBvPerSecond,
    ios,
    rqp,
    ioe,
    correctness,
    throughput,
    zini: null,
  };
}
