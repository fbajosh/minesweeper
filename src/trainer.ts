import { countRemainingMinesEstimate, getNeighborIndices } from "./game";
import type { GameState, TrainerCellProbability, TrainerModel } from "./types";

const MAX_COMPONENT_SIZE = 24;
const MAX_SEARCH_NODES = 250000;

interface Constraint {
  cells: number[];
  mines: number;
}

interface Component {
  cells: number[];
  constraints: Constraint[];
}

interface SolvedComponent {
  cells: number[];
  probabilities: number[];
  totalSolutions: number;
  solved: boolean;
}

function buildConstraintModel(state: GameState): {
  hiddenUnflagged: number[];
  frontier: Set<number>;
  constraints: Constraint[];
  baselineProbability: number;
  inconsistent: boolean;
} {
  const hiddenUnflagged = state.cells
    .filter((cell) => !cell.revealed && !cell.flagged)
    .map((cell) => cell.index);
  const hiddenUnflaggedSet = new Set(hiddenUnflagged);
  const frontier = new Set<number>();
  const constraints: Constraint[] = [];
  const remainingMines = Math.max(0, countRemainingMinesEstimate(state));
  const baselineProbability = hiddenUnflagged.length > 0 ? remainingMines / hiddenUnflagged.length : 0;
  let inconsistent = false;

  for (const cell of state.cells) {
    if (!cell.revealed || cell.adjacentMines <= 0) {
      continue;
    }

    const neighbors = getNeighborIndices(state, cell.index);
    const hiddenNeighbors = neighbors.filter((neighborIndex) => hiddenUnflaggedSet.has(neighborIndex));
    if (hiddenNeighbors.length === 0) {
      continue;
    }

    for (const hiddenNeighbor of hiddenNeighbors) {
      frontier.add(hiddenNeighbor);
    }

    const flaggedNeighbors = neighbors.filter((neighborIndex) => state.cells[neighborIndex].flagged).length;
    const remainingNeeded = cell.adjacentMines - flaggedNeighbors;
    if (remainingNeeded < 0 || remainingNeeded > hiddenNeighbors.length) {
      inconsistent = true;
      continue;
    }

    constraints.push({
      cells: hiddenNeighbors,
      mines: remainingNeeded,
    });
  }

  return {
    hiddenUnflagged,
    frontier,
    constraints,
    baselineProbability,
    inconsistent,
  };
}

function connectedComponents(frontier: Set<number>, constraints: Constraint[]): Component[] {
  const parent = new Map<number, number>();

  const find = (value: number): number => {
    let current = parent.get(value) ?? value;
    while ((parent.get(current) ?? current) !== current) {
      current = parent.get(current) ?? current;
    }
    return current;
  };

  const union = (a: number, b: number): void => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) {
      parent.set(rootB, rootA);
    }
  };

  for (const cellIndex of frontier) {
    parent.set(cellIndex, cellIndex);
  }

  for (const constraint of constraints) {
    const [firstCell, ...rest] = constraint.cells;
    if (firstCell === undefined) {
      continue;
    }
    for (const otherCell of rest) {
      union(firstCell, otherCell);
    }
  }

  const componentCells = new Map<number, number[]>();
  for (const cellIndex of frontier) {
    const root = find(cellIndex);
    const entry = componentCells.get(root);
    if (entry) {
      entry.push(cellIndex);
    } else {
      componentCells.set(root, [cellIndex]);
    }
  }

  return [...componentCells.values()].map((cells) => {
    const cellSet = new Set(cells);
    return {
      cells,
      constraints: constraints.filter((constraint) => constraint.cells.some((cellIndex) => cellSet.has(cellIndex))),
    };
  });
}

function solveComponent(component: Component): SolvedComponent {
  if (component.cells.length === 0) {
    return {
      cells: [],
      probabilities: [],
      totalSolutions: 1,
      solved: true,
    };
  }

  if (component.cells.length > MAX_COMPONENT_SIZE) {
    return {
      cells: component.cells,
      probabilities: component.cells.map(() => 0),
      totalSolutions: 0,
      solved: false,
    };
  }

  const order = [...component.cells].sort((left, right) => {
    const leftScore = component.constraints.filter((constraint) => constraint.cells.includes(left)).length;
    const rightScore = component.constraints.filter((constraint) => constraint.cells.includes(right)).length;
    return rightScore - leftScore;
  });

  const cellConstraintMap = new Map<number, number[]>();
  component.constraints.forEach((constraint, constraintIndex) => {
    for (const cellIndex of constraint.cells) {
      const entries = cellConstraintMap.get(cellIndex);
      if (entries) {
        entries.push(constraintIndex);
      } else {
        cellConstraintMap.set(cellIndex, [constraintIndex]);
      }
    }
  });

  const remainingMines = component.constraints.map((constraint) => constraint.mines);
  const remainingCells = component.constraints.map((constraint) => constraint.cells.length);
  const mineTally = new Map<number, number>();
  component.cells.forEach((cellIndex) => mineTally.set(cellIndex, 0));
  let totalSolutions = 0;
  let searchNodes = 0;

  const assign = (position: number, chosenMines: number[]): boolean => {
    searchNodes += 1;
    if (searchNodes > MAX_SEARCH_NODES) {
      return false;
    }

    if (position >= order.length) {
      if (remainingMines.every((value) => value === 0)) {
        totalSolutions += 1;
        for (const cellIndex of chosenMines) {
          mineTally.set(cellIndex, (mineTally.get(cellIndex) ?? 0) + 1);
        }
      }
      return true;
    }

    const cellIndex = order[position];
    const constraintIndices = cellConstraintMap.get(cellIndex) ?? [];

    for (const assignment of [0, 1]) {
      const updates: Array<{ index: number; mines: number; cells: number }> = [];
      let valid = true;

      for (const constraintIndex of constraintIndices) {
        updates.push({
          index: constraintIndex,
          mines: remainingMines[constraintIndex],
          cells: remainingCells[constraintIndex],
        });
        remainingCells[constraintIndex] -= 1;
        remainingMines[constraintIndex] -= assignment;
        if (
          remainingMines[constraintIndex] < 0 ||
          remainingMines[constraintIndex] > remainingCells[constraintIndex]
        ) {
          valid = false;
          break;
        }
      }

      if (valid) {
        if (assignment === 1) {
          chosenMines.push(cellIndex);
        }
        const completed = assign(position + 1, chosenMines);
        if (assignment === 1) {
          chosenMines.pop();
        }
        if (!completed) {
          return false;
        }
      }

      for (const update of updates) {
        remainingMines[update.index] = update.mines;
        remainingCells[update.index] = update.cells;
      }
    }

    return true;
  };

  const solved = assign(0, []);
  if (!solved || totalSolutions === 0) {
    return {
      cells: component.cells,
      probabilities: component.cells.map(() => 0),
      totalSolutions: 0,
      solved: false,
    };
  }

  return {
    cells: component.cells,
    probabilities: component.cells.map((cellIndex) => (mineTally.get(cellIndex) ?? 0) / totalSolutions),
    totalSolutions,
    solved: true,
  };
}

export function computeTrainerModel(state: GameState): TrainerModel {
  const { hiddenUnflagged, frontier, constraints, baselineProbability, inconsistent } = buildConstraintModel(state);
  const probabilities = new Map<number, TrainerCellProbability>();

  if (hiddenUnflagged.length === 0) {
    return {
      probabilities,
      baselineProbability: 0,
      unresolvedComponents: 0,
    };
  }

  if (constraints.length === 0 || inconsistent) {
    for (const index of hiddenUnflagged) {
      probabilities.set(index, {
        probability: baselineProbability,
        source: "baseline",
      });
    }

    return {
      probabilities,
      baselineProbability,
      unresolvedComponents: inconsistent ? 1 : 0,
    };
  }

  const components = connectedComponents(frontier, constraints);
  let expectedFrontierMines = 0;
  let solvedFrontierCount = 0;
  let unresolvedComponents = 0;

  for (const component of components) {
    const localConstraints = component.constraints.map((constraint) => ({
      cells: constraint.cells.filter((cellIndex) => component.cells.includes(cellIndex)),
      mines: constraint.mines,
    }));
    const solution = solveComponent({
      cells: component.cells,
      constraints: localConstraints,
    });

    if (!solution.solved) {
      unresolvedComponents += 1;
      continue;
    }

    solution.cells.forEach((cellIndex, position) => {
      const probability = solution.probabilities[position];
      probabilities.set(cellIndex, {
        probability,
        source: "component",
      });
      expectedFrontierMines += probability;
      solvedFrontierCount += 1;
    });
  }

  const remainingMines = Math.max(0, countRemainingMinesEstimate(state) - expectedFrontierMines);
  const fallbackTargets = hiddenUnflagged.filter((index) => !probabilities.has(index));
  const derivedProbability =
    fallbackTargets.length > 0 ? Math.max(0, Math.min(1, remainingMines / fallbackTargets.length)) : baselineProbability;

  for (const index of fallbackTargets) {
    probabilities.set(index, {
      probability: derivedProbability,
      source: unresolvedComponents > 0 && frontier.has(index) ? "baseline" : "derived",
    });
  }

  if (solvedFrontierCount === 0) {
    for (const index of hiddenUnflagged) {
      probabilities.set(index, {
        probability: baselineProbability,
        source: "baseline",
      });
    }
  }

  return {
    probabilities,
    baselineProbability: derivedProbability,
    unresolvedComponents,
  };
}
