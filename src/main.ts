import {
  DEFAULT_SETTINGS,
  DIRECTION_VECTORS,
  LANGUAGES,
  MAX_AUTO_FIT_COLUMNS,
  MAX_AUTO_FIT_ROWS,
  MAX_COUNTER_VALUE,
  PRESET_DIFFICULTIES,
  THEMES,
  TIMER_TICK_MS,
  clampCustomBoard,
  configForCustom,
  configForPreset,
} from "./constants";
import {
  chordCell,
  coordinatesFor,
  countRemainingMinesEstimate,
  createGame,
  getCell,
  getElapsedMs,
  getNeighborIndices,
  isOversizedBoard,
  revealCell,
  toggleFlag,
} from "./game";
import {
  applyTranslations,
  difficultyLabel,
  languageLabel,
  overlayLabel,
  themeLabel,
  touchTapModeLabel,
  translate,
} from "./i18n";
import { saveGameRecord } from "./storage";
import { readStoredSettings, readStoredStats, recordFinishedGame, statsBucketForConfig, writeStoredSettings, writeStoredStats } from "./stats";
import { applyTheme } from "./theme";
import { computeTrainerModel } from "./trainer";
import type {
  AppSettings,
  BoardConfig,
  CellState,
  DifficultyLevel,
  GameActionRecord,
  GameActionType,
  GameOutcome,
  GameState,
  LanguageCode,
  OverlayMode,
  PointerKind,
  ThemeName,
  TouchTapMode,
  TrainerModel,
} from "./types";

interface CellElements {
  button: HTMLButtonElement;
  value: HTMLSpanElement;
  trainer: HTMLSpanElement;
}

interface ActiveSession {
  createdAtIso: string;
  actions: GameActionRecord[];
  persisted: boolean;
}

interface PendingTap {
  index: number;
  action: "open" | "chord";
  expiresAt: number;
  timerId: number;
}

interface PointerSession {
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
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }
  return element;
}

function asPointerKind(value: string): PointerKind {
  if (value === "mouse" || value === "touch" || value === "pen") {
    return value;
  }
  return "system";
}

function formatCounter(value: number): string {
  const clamped = Math.max(-99, Math.min(MAX_COUNTER_VALUE, Math.trunc(value)));
  if (clamped < 0) {
    return `-${String(Math.abs(clamped)).padStart(2, "0")}`;
  }
  return String(clamped).padStart(3, "0");
}

function formatDuration(ms: number | null): string {
  if (ms === null) {
    return "—";
  }

  if (ms < 1000) {
    return "0.0s";
  }

  return `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)}s`;
}

function trainerMix(probability: number): string {
  const safeWeight = Math.round((1 - probability) * 100);
  const riskWeight = Math.round(probability * 100);
  return `color-mix(in srgb, var(--trainer-safe) ${safeWeight}%, var(--trainer-risk) ${riskWeight}%)`;
}

function dotBucket(probability: number): 1 | 2 | 3 | 4 {
  if (probability < 0.25) {
    return 1;
  }
  if (probability < 0.5) {
    return 2;
  }
  if (probability < 0.75) {
    return 3;
  }
  return 4;
}

class MinesweeperApp {
  private settings: AppSettings = readStoredSettings();

  private stats = readStoredStats();

  private config: BoardConfig = configForPreset(2);

  private game: GameState = createGame(this.config);

  private trainerModel: TrainerModel = {
    probabilities: new Map(),
    baselineProbability: 0,
    unresolvedComponents: 0,
  };

  private activeSession: ActiveSession | null = null;

  private cellElements: CellElements[] = [];

  private timerHandle = 0;

  private openMenuName: string | null = null;

  private pendingTap: PendingTap | null = null;

  private pointerSession: PointerSession | null = null;

  private hoveredIndex: number | null = null;

  private statusOverrideKey: string | null = null;

  private displayColumns = this.config.columns;

  private displayRows = this.config.rows;

  private boardScale = 1;

  private rotatedBoard = false;

  private readonly appWindow = requireElement<HTMLElement>("#app-window");

  private readonly boardShell = requireElement<HTMLElement>("#board-shell");

  private readonly boardViewport = requireElement<HTMLElement>("#board-viewport");

  private readonly boardTransformLayer = requireElement<HTMLElement>("#board-transform-layer");

  private readonly boardGrid = requireElement<HTMLElement>("#board-grid");

  private readonly mineCounter = requireElement<HTMLElement>("#mine-counter");

  private readonly timerCounter = requireElement<HTMLElement>("#timer-counter");

  private readonly faceButton = requireElement<HTMLButtonElement>("#face-button");

  private readonly faceLabel = requireElement<HTMLElement>("#face-button-label");

  private readonly difficultyPill = requireElement<HTMLElement>("#difficulty-pill");

  private readonly trainerPill = requireElement<HTMLElement>("#trainer-pill");

  private readonly statusText = requireElement<HTMLElement>("#status-text");

  private readonly panHint = requireElement<HTMLElement>("#pan-hint");

  private readonly hoverHint = requireElement<HTMLElement>("#hover-hint");

  private readonly customDialog = requireElement<HTMLDialogElement>("#custom-dialog");

  private readonly customForm = requireElement<HTMLFormElement>("#custom-form");

  private readonly customColumns = requireElement<HTMLInputElement>("#custom-columns");

  private readonly customRows = requireElement<HTMLInputElement>("#custom-rows");

  private readonly customMines = requireElement<HTMLInputElement>("#custom-mines");

  private readonly settingsDialog = requireElement<HTMLDialogElement>("#settings-dialog");

  private readonly doubleTapRange = requireElement<HTMLInputElement>("#double-tap-range");

  private readonly longPressRange = requireElement<HTMLInputElement>("#long-press-range");

  private readonly dragThresholdRange = requireElement<HTMLInputElement>("#drag-threshold-range");

  private readonly doubleTapValue = requireElement<HTMLElement>("#double-tap-value");

  private readonly longPressValue = requireElement<HTMLElement>("#long-press-value");

  private readonly dragThresholdValue = requireElement<HTMLElement>("#drag-threshold-value");

  private readonly touchTapModeSelect = requireElement<HTMLSelectElement>("#touch-tap-mode-select");

  private readonly bestTimesDialog = requireElement<HTMLDialogElement>("#best-times-dialog");

  private readonly bestTimesContext = requireElement<HTMLElement>("#best-times-context");

  private readonly bestTimesList = requireElement<HTMLOListElement>("#best-times-list");

  private readonly bestTimesEmpty = requireElement<HTMLElement>("#best-times-empty");

  private readonly statisticsDialog = requireElement<HTMLDialogElement>("#statistics-dialog");

  private readonly currentStatsList = requireElement<HTMLElement>("#current-stats-list");

  private readonly overallStatsList = requireElement<HTMLElement>("#overall-stats-list");

  private readonly statsEmpty = requireElement<HTMLElement>("#stats-empty");

  private readonly controlsDialog = requireElement<HTMLDialogElement>("#controls-dialog");

  private readonly aboutDialog = requireElement<HTMLDialogElement>("#about-dialog");

  init(): void {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...this.settings,
    };

    this.config = configForPreset(this.settings.selectedDifficultyLevel);
    this.game = createGame(this.config);
    this.activeSession = this.createActiveSession();

    this.bindEvents();
    this.applyLanguage();
    this.applyTheme();
    this.rebuildBoard();
    this.renderAll();
    this.timerHandle = window.setInterval(() => this.renderClock(), TIMER_TICK_MS);
  }

  private bindEvents(): void {
    this.faceButton.addEventListener("click", () => {
      this.newGame(this.config);
    });

    this.faceButton.addEventListener("pointerdown", () => {
      this.faceButton.classList.add("is-pressed");
    });

    this.faceButton.addEventListener("pointerup", () => {
      this.faceButton.classList.remove("is-pressed");
    });

    this.faceButton.addEventListener("pointercancel", () => {
      this.faceButton.classList.remove("is-pressed");
    });

    for (const titleButton of document.querySelectorAll<HTMLButtonElement>(".title-button")) {
      titleButton.addEventListener("click", (event) => {
        event.preventDefault();
      });
    }

    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".menu-shell")) {
        this.closeMenus();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.closeMenus();
      }
    });

    for (const menuShell of document.querySelectorAll<HTMLElement>(".menu-shell")) {
      const menuName = menuShell.dataset.menuShell;
      const trigger = menuShell.querySelector<HTMLButtonElement>("[data-menu-trigger]");
      if (!menuName || !trigger) {
        continue;
      }

      trigger.addEventListener("click", (event) => {
        event.stopPropagation();
        this.toggleMenu(menuName);
      });

      menuShell.addEventListener("mouseenter", () => {
        if (this.openMenuName) {
          this.openMenu(menuName);
        }
      });
    }

    for (const submenuTrigger of document.querySelectorAll<HTMLElement>("[data-submenu-trigger]")) {
      submenuTrigger.addEventListener("click", (event) => {
        event.stopPropagation();
        for (const current of document.querySelectorAll<HTMLElement>(".menu-entry-submenu.is-open")) {
          if (current !== submenuTrigger) {
            current.classList.remove("is-open");
          }
        }
        submenuTrigger.classList.toggle("is-open");
      });
    }

    document.querySelectorAll<HTMLElement>("[data-dialog-close]").forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.dataset.dialogClose;
        if (!targetId) {
          return;
        }
        requireElement<HTMLDialogElement>(`#${targetId}`).close();
      });
    });

    this.customForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = clampCustomBoard(
        Number(this.customColumns.value),
        Number(this.customRows.value),
        Number(this.customMines.value),
      );
      this.settings.customBoard = values;
      this.persistSettings();
      this.customDialog.close();
      this.newGame(configForCustom(values.columns, values.rows, values.mines));
    });

    const syncCustomMineLimit = () => {
      const safeColumns = Math.max(8, Number(this.customColumns.value) || this.settings.customBoard.columns);
      const safeRows = Math.max(8, Number(this.customRows.value) || this.settings.customBoard.rows);
      const maxMines = Math.max(1, safeColumns * safeRows - 1);
      this.customMines.max = String(maxMines);
      if (Number(this.customMines.value) > maxMines) {
        this.customMines.value = String(maxMines);
      }
    };

    this.customColumns.addEventListener("input", syncCustomMineLimit);
    this.customRows.addEventListener("input", syncCustomMineLimit);

    const syncSettingsFromRanges = () => {
      this.settings.interaction.doubleTapMs = Number(this.doubleTapRange.value);
      this.settings.interaction.longPressMs = Number(this.longPressRange.value);
      this.settings.interaction.dragThresholdPx = Number(this.dragThresholdRange.value);
      this.settings.interaction.touchTapMode = this.touchTapModeSelect.value as TouchTapMode;
      this.persistSettings();
      this.renderSettingsDialog();
    };

    this.doubleTapRange.addEventListener("input", syncSettingsFromRanges);
    this.longPressRange.addEventListener("input", syncSettingsFromRanges);
    this.dragThresholdRange.addEventListener("input", syncSettingsFromRanges);
    this.touchTapModeSelect.addEventListener("change", syncSettingsFromRanges);

    document.querySelectorAll<HTMLButtonElement>("[data-menu-action]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const action = button.dataset.menuAction;
        this.handleMenuAction(action);
      });
    });

    document.querySelectorAll<HTMLButtonElement>("[data-difficulty-level]").forEach((button) => {
      button.addEventListener("click", () => {
        const level = Number(button.dataset.difficultyLevel) as DifficultyLevel;
        this.settings.selectedDifficultyLevel = level;
        this.persistSettings();
        this.closeMenus();
        this.newGame(configForPreset(level));
      });
    });

    document.querySelectorAll<HTMLButtonElement>("[data-overlay-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        const overlayMode = button.dataset.overlayMode as OverlayMode;
        this.settings.trainer.overlayMode = overlayMode;
        this.persistSettings();
        this.refreshTrainerModel();
        this.renderAll();
        this.closeMenus();
      });
    });

    document.querySelectorAll<HTMLButtonElement>("[data-theme-name]").forEach((button) => {
      button.addEventListener("click", () => {
        const theme = button.dataset.themeName as ThemeName;
        this.settings.theme = theme;
        this.persistSettings();
        this.applyTheme();
        this.renderAll();
        this.closeMenus();
      });
    });

    document.querySelectorAll<HTMLButtonElement>("[data-language-code]").forEach((button) => {
      button.addEventListener("click", () => {
        const language = button.dataset.languageCode as LanguageCode;
        this.settings.language = language;
        this.persistSettings();
        this.applyLanguage();
        this.renderAll();
        this.closeMenus();
      });
    });

    this.boardGrid.addEventListener("contextmenu", (event) => {
      const cellButton = this.getCellButtonFromEvent(event);
      if (!cellButton) {
        return;
      }

      event.preventDefault();
      const index = Number(cellButton.dataset.index);
      this.clearPendingTap();
      this.performGameAction("flag", index, "right-click", "mouse");
    });

    this.boardGrid.addEventListener("dblclick", (event) => {
      const cellButton = this.getCellButtonFromEvent(event);
      if (!cellButton) {
        return;
      }
      event.preventDefault();
      const index = Number(cellButton.dataset.index);
      this.clearPendingTap();
      this.performGameAction("chord", index, "double-click", "mouse");
    });

    this.boardGrid.addEventListener("pointerdown", (event) => this.handleBoardPointerDown(event));
    this.boardViewport.addEventListener("pointermove", (event) => this.handleBoardPointerMove(event));
    this.boardViewport.addEventListener("pointerup", (event) => this.handleBoardPointerUp(event));
    this.boardViewport.addEventListener("pointercancel", () => this.clearPointerSession());

    this.boardGrid.addEventListener("mouseover", (event) => {
      const cellButton = this.getCellButtonFromEvent(event);
      if (!cellButton) {
        return;
      }
      this.setHoveredIndex(Number(cellButton.dataset.index));
    });

    this.boardGrid.addEventListener("mouseleave", () => {
      this.setHoveredIndex(null);
    });

    window.addEventListener("resize", () => {
      this.syncBoardMetrics();
      this.renderAll();
    });
  }

  private createActiveSession(): ActiveSession {
    return {
      createdAtIso: new Date(this.game.createdAtMs).toISOString(),
      actions: [],
      persisted: false,
    };
  }

  private handleMenuAction(action: string | undefined): void {
    if (!action) {
      return;
    }

    if (action === "new-game") {
      this.closeMenus();
      this.newGame(this.config);
      return;
    }

    if (action === "open-custom-dialog") {
      this.renderCustomDialog();
      this.closeMenus();
      this.customDialog.showModal();
      return;
    }

    if (action === "open-best-times-dialog") {
      this.renderBestTimesDialog();
      this.closeMenus();
      this.bestTimesDialog.showModal();
      return;
    }

    if (action === "open-statistics-dialog") {
      this.renderStatisticsDialog();
      this.closeMenus();
      this.statisticsDialog.showModal();
      return;
    }

    if (action === "toggle-trainer") {
      this.settings.trainer.enabled = !this.settings.trainer.enabled;
      this.persistSettings();
      this.refreshTrainerModel();
      this.renderAll();
      return;
    }

    if (action === "open-settings-dialog") {
      this.renderSettingsDialog();
      this.closeMenus();
      this.settingsDialog.showModal();
      return;
    }

    if (action === "open-controls-dialog") {
      this.closeMenus();
      this.controlsDialog.showModal();
      return;
    }

    if (action === "open-about-dialog") {
      this.closeMenus();
      this.aboutDialog.showModal();
    }
  }

  private handleBoardPointerDown(event: PointerEvent): void {
    const cellButton = this.getCellButtonFromEvent(event);
    if (!cellButton) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    this.closeMenus();

    const index = Number(cellButton.dataset.index);
    const pointerType = asPointerKind(event.pointerType);
    this.pointerSession = {
      pointerId: event.pointerId,
      pointerType,
      cellIndex: index,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: this.boardViewport.scrollLeft,
      startScrollTop: this.boardViewport.scrollTop,
      dragging: false,
      longPressTriggered: false,
      holdTimerId: null,
    };

    cellButton.classList.add("is-pressing");
    this.faceButton.classList.add("is-pressed");
    this.boardViewport.setPointerCapture(event.pointerId);

    if (pointerType !== "mouse") {
      const targetCell = this.game.cells[index];
      if (targetCell && !targetCell.revealed && this.game.status !== "won" && this.game.status !== "lost") {
        this.pointerSession.holdTimerId = window.setTimeout(() => {
          if (!this.pointerSession || this.pointerSession.pointerId !== event.pointerId) {
            return;
          }
          this.pointerSession.longPressTriggered = true;
          this.performGameAction("flag", index, "long-press", pointerType);
          this.clearPressedState();
        }, this.settings.interaction.longPressMs);
      }
    }
  }

  private handleBoardPointerMove(event: PointerEvent): void {
    if (event.pointerType === "mouse" && event.buttons === 0) {
      return;
    }

    if (!this.pointerSession || this.pointerSession.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - this.pointerSession.startX;
    const deltaY = event.clientY - this.pointerSession.startY;
    const distance = Math.hypot(deltaX, deltaY);
    const isPannable = this.boardViewport.classList.contains("is-pannable");

    if (!this.pointerSession.dragging && distance >= this.settings.interaction.dragThresholdPx) {
      this.pointerSession.dragging = true;
      this.statusOverrideKey = "status.panning";
      this.clearLongPressTimer();
      this.clearPressedState();
      this.boardViewport.classList.add("is-dragging");
    }

    if (!this.pointerSession.dragging) {
      return;
    }

    event.preventDefault();
    if (isPannable) {
      this.boardViewport.scrollLeft = this.pointerSession.startScrollLeft - deltaX;
      this.boardViewport.scrollTop = this.pointerSession.startScrollTop - deltaY;
    }
    this.renderStatus();
  }

  private handleBoardPointerUp(event: PointerEvent): void {
    if (!this.pointerSession || this.pointerSession.pointerId !== event.pointerId) {
      return;
    }

    const pointerSession = this.pointerSession;
    const index = pointerSession.cellIndex;
    const cell = getCell(this.game, index);

    this.clearLongPressTimer();
    this.boardViewport.releasePointerCapture(event.pointerId);

    if (pointerSession.dragging) {
      this.statusOverrideKey = null;
      this.clearPointerSession();
      this.renderStatus();
      return;
    }

    if (pointerSession.longPressTriggered) {
      this.statusOverrideKey = null;
      this.clearPointerSession();
      this.renderAll();
      return;
    }

    if (!cell) {
      this.clearPointerSession();
      return;
    }

    if (pointerSession.pointerType === "mouse") {
      if (event.shiftKey) {
        this.performGameAction("chord", index, "shift-click", "mouse");
      } else if (!cell.revealed && !cell.flagged) {
        this.performGameAction("open", index, "left-click", "mouse");
      }
      this.clearPointerSession();
      return;
    }

    this.handleTouchTap(index, pointerSession.pointerType);
    this.clearPointerSession();
  }

  private handleTouchTap(index: number, pointerType: PointerKind): void {
    const cell = this.game.cells[index];
    if (!cell || this.game.status === "won" || this.game.status === "lost") {
      return;
    }

    let action: "open" | "chord" | null = null;
    let mode: "single" | "double" = "single";

    if (!cell.revealed && !cell.flagged) {
      action = "open";
      mode = this.settings.interaction.touchTapMode === "single-open" ? "single" : "double";
    } else if (cell.revealed && cell.adjacentMines > 0) {
      action = "chord";
      mode = this.settings.interaction.touchTapMode === "single-open" ? "double" : "single";
    }

    if (!action) {
      return;
    }

    if (mode === "single") {
      this.clearPendingTap();
      this.performGameAction(action, index, action === "open" ? "single-tap" : "single-tap-chord", pointerType);
      return;
    }

    const now = Date.now();
    if (
      this.pendingTap &&
      this.pendingTap.index === index &&
      this.pendingTap.action === action &&
      this.pendingTap.expiresAt >= now
    ) {
      this.clearPendingTap();
      this.performGameAction(action, index, action === "open" ? "double-tap-open" : "double-tap-chord", pointerType);
      return;
    }

    this.clearPendingTap();
    const timerId = window.setTimeout(() => {
      this.pendingTap = null;
    }, this.settings.interaction.doubleTapMs);

    this.pendingTap = {
      index,
      action,
      expiresAt: now + this.settings.interaction.doubleTapMs,
      timerId,
    };
  }

  private performGameAction(
    actionType: GameActionType,
    index: number,
    gesture: string,
    pointerType: PointerKind,
  ): void {
    const now = Date.now();
    let acted = false;
    let changedIndices: number[] = [];

    if (actionType === "open") {
      const result = revealCell(this.game, index, now);
      acted = result.acted;
      changedIndices = result.changedIndices;
    } else if (actionType === "flag") {
      const result = toggleFlag(this.game, index, now);
      acted = result.acted;
      changedIndices = result.changedIndices;
    } else if (actionType === "chord") {
      const result = chordCell(this.game, index, now);
      acted = result.acted;
      changedIndices = result.changedIndices;
    }

    if (!acted) {
      this.renderAll();
      return;
    }

    this.logAction(actionType, gesture, pointerType, index, changedIndices, now);
    this.refreshTrainerModel();

    if (this.game.status === "won" || this.game.status === "lost") {
      this.finalizeSession();
    }
    this.renderAll();
  }

  private logAction(
    actionType: GameActionType,
    gesture: string,
    pointerType: PointerKind,
    index: number,
    changedIndices: number[],
    now: number,
  ): void {
    if (!this.activeSession) {
      this.activeSession = this.createActiveSession();
    }

    const cell = this.game.cells[index];
    const changedCells = changedIndices.map((changedIndex) => {
      const changedCell = this.game.cells[changedIndex];
      return {
        x: changedCell.x,
        y: changedCell.y,
        index: changedCell.index,
        revealed: changedCell.revealed,
        flagged: changedCell.flagged,
        adjacentMines: changedCell.adjacentMines,
        exploded: changedCell.exploded,
      };
    });

    const origin = this.game.cells[index];
    const neighborSnapshot = DIRECTION_VECTORS.map((vector) => {
      const neighborX = origin.x + vector.dx;
      const neighborY = origin.y + vector.dy;
      if (
        neighborX < 0 ||
        neighborY < 0 ||
        neighborX >= this.game.config.columns ||
        neighborY >= this.game.config.rows
      ) {
        return {
          direction: vector.key,
          x: null,
          y: null,
          revealed: null,
          flagged: null,
          adjacentMines: null,
        };
      }

      const neighbor = this.game.cells[neighborY * this.game.config.columns + neighborX];
      return {
        direction: vector.key,
        x: neighbor.x,
        y: neighbor.y,
        revealed: neighbor.revealed,
        flagged: neighbor.flagged,
        adjacentMines: neighbor.revealed ? neighbor.adjacentMines : null,
      };
    });

    this.activeSession.actions.push({
      index: this.activeSession.actions.length,
      type: actionType,
      gesture,
      pointerType,
      timestampMs: now,
      elapsedMs: getElapsedMs(this.game, now),
      cell: {
        x: cell.x,
        y: cell.y,
        index: cell.index,
      },
      remainingMinesEstimate: countRemainingMinesEstimate(this.game),
      revealedCount: this.game.revealedCount,
      flagsPlaced: this.game.flagsPlaced,
      trainerEnabled: this.settings.trainer.enabled,
      neighborSnapshot,
      changedCells,
    });
  }

  private finalizeSession(): void {
    if (!this.activeSession || this.activeSession.persisted || this.activeSession.actions.length === 0) {
      return;
    }

    const outcome: GameOutcome = this.game.status === "won" ? "won" : this.game.status === "lost" ? "lost" : "abandoned";
    const durationMs = getElapsedMs(this.game, Date.now());

    const record = {
      id: this.game.id,
      createdAtIso: this.activeSession.createdAtIso,
      finishedAtIso: new Date().toISOString(),
      config: this.game.config,
      seed: this.game.seed,
      firstRevealIndex: this.game.firstRevealIndex,
      outcome,
      durationMs,
      moveCount: this.game.moveCount,
      actions: this.activeSession.actions,
    };

    this.stats = recordFinishedGame(this.stats, record);
    writeStoredStats(this.stats);
    void saveGameRecord(record).catch(() => {
      // Ignore IndexedDB failures and keep local summary stats usable.
    });
    this.activeSession.persisted = true;
  }

  private newGame(config: BoardConfig): void {
    this.clearPendingTap();
    this.closeMenus();
    this.finalizeSession();
    this.config = config;
    this.game = createGame(config);
    this.activeSession = this.createActiveSession();
    this.statusOverrideKey = null;
    this.hoveredIndex = null;
    this.boardViewport.scrollTo({ left: 0, top: 0 });
    this.rebuildBoard();
    this.refreshTrainerModel();
    this.renderAll();
  }

  private refreshTrainerModel(): void {
    if (!this.settings.trainer.enabled || this.game.status === "lost") {
      this.trainerModel = {
        probabilities: new Map(),
        baselineProbability: 0,
        unresolvedComponents: 0,
      };
      return;
    }

    this.trainerModel = computeTrainerModel(this.game);
  }

  private rebuildBoard(): void {
    this.boardGrid.replaceChildren();
    this.cellElements = [];

    for (const cell of this.game.cells) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cell is-hidden";
      button.dataset.index = String(cell.index);

      const value = document.createElement("span");
      value.className = "cell-value";
      value.setAttribute("aria-hidden", "true");

      const trainer = document.createElement("span");
      trainer.className = "cell-trainer";
      trainer.setAttribute("aria-hidden", "true");

      button.append(value, trainer);
      this.boardGrid.append(button);
      this.cellElements.push({ button, value, trainer });
    }

    this.syncBoardMetrics();
  }

  private syncBoardMetrics(): void {
    const portrait = window.innerHeight > window.innerWidth;
    this.rotatedBoard = portrait && this.config.columns > this.config.rows;
    this.displayColumns = this.rotatedBoard ? this.config.rows : this.config.columns;
    this.displayRows = this.rotatedBoard ? this.config.columns : this.config.rows;

    const baseCellSize = 16;
    const maxScale = portrait ? 3.2 : 1.75;
    const viewportMargin = window.innerWidth < 560 ? 12 : 24;
    const reservedHeight = window.innerWidth < 560 ? 150 : 210;
    const availableWidth = Math.max(160, window.innerWidth - viewportMargin);
    const availableHeight = Math.max(180, window.innerHeight - reservedHeight);
    const fitColumns = Math.min(this.displayColumns, this.rotatedBoard ? 16 : MAX_AUTO_FIT_COLUMNS);
    const fitRows = Math.min(this.displayRows, this.rotatedBoard ? 30 : MAX_AUTO_FIT_ROWS);
    const scale = Math.max(
      1,
      Math.min(
        maxScale,
        availableWidth / (fitColumns * baseCellSize),
        availableHeight / (fitRows * baseCellSize),
      ),
    );

    this.boardScale = scale;

    const baseWidth = this.displayColumns * baseCellSize;
    const baseHeight = this.displayRows * baseCellSize;
    const renderWidth = Math.round(baseWidth * scale);
    const renderHeight = Math.round(baseHeight * scale);
    const viewportWidth = Math.min(Math.round(availableWidth), renderWidth);
    const viewportHeight = Math.min(Math.round(availableHeight), renderHeight);

    this.boardViewport.style.width = `${viewportWidth}px`;
    this.boardViewport.style.height = `${viewportHeight}px`;
    this.boardTransformLayer.style.width = `${renderWidth}px`;
    this.boardTransformLayer.style.height = `${renderHeight}px`;
    this.boardGrid.style.width = `${baseWidth}px`;
    this.boardGrid.style.height = `${baseHeight}px`;
    this.boardGrid.style.transform = `scale(${scale})`;
    this.boardGrid.style.setProperty("--display-columns", String(this.displayColumns));
    this.boardGrid.style.setProperty("--display-rows", String(this.displayRows));
    this.boardViewport.classList.toggle("is-pannable", renderWidth > viewportWidth || renderHeight > viewportHeight);

    for (const cell of this.game.cells) {
      const elements = this.cellElements[cell.index];
      if (!elements) {
        continue;
      }
      const { column, row } = this.displayPositionForCell(cell);
      elements.button.style.gridColumnStart = String(column + 1);
      elements.button.style.gridRowStart = String(row + 1);
    }
  }

  private renderAll(): void {
    this.renderMenuState();
    this.renderStatus();
    this.renderScoreboard();
    this.renderBoard();
    this.renderTrainerMeta();
    this.renderSettingsDialog();
    this.renderStatisticsDialog();
    this.renderBestTimesDialog();
  }

  private renderScoreboard(): void {
    this.mineCounter.textContent = formatCounter(countRemainingMinesEstimate(this.game));
    this.renderClock();

    if (this.game.status === "won") {
      this.faceLabel.textContent = "8)";
    } else if (this.game.status === "lost") {
      this.faceLabel.textContent = "X(";
    } else if (this.pointerSession && !this.pointerSession.dragging) {
      this.faceLabel.textContent = ":O";
    } else {
      this.faceLabel.textContent = ":)";
    }
  }

  private renderClock(): void {
    const seconds = Math.floor(getElapsedMs(this.game, Date.now()) / 1000);
    this.timerCounter.textContent = formatCounter(seconds);
  }

  private renderTrainerMeta(): void {
    const language = this.settings.language;
    const difficultyText =
      this.config.kind === "custom"
        ? translate(language, "controls.currentDifficulty", {
            label: translate(language, "difficulty.custom"),
            columns: this.config.columns,
            rows: this.config.rows,
            mines: this.config.mines,
          })
        : translate(language, "controls.currentDifficulty", {
            label: difficultyLabel(language, this.config.presetLevel ?? 2, this.config.classicLabel),
            columns: this.config.columns,
            rows: this.config.rows,
            mines: this.config.mines,
          });

    const trainerText = `${translate(language, "controls.trainer")}: ${
      this.settings.trainer.enabled ? translate(language, "controls.on") : translate(language, "controls.off")
    }`;

    this.difficultyPill.textContent = difficultyText;
    this.trainerPill.textContent = `${trainerText} • ${translate(language, "controls.trainerMode", {
      mode: overlayLabel(language, this.settings.trainer.overlayMode),
    })}`;

    if (isOversizedBoard(this.config)) {
      this.panHint.textContent = translate(language, "status.oversized");
    } else {
      this.panHint.textContent = `${translate(language, "controls.themeLabel", {
        theme: themeLabel(language, this.settings.theme),
      })} • ${translate(language, "controls.languageLabel", {
        language: languageLabel(language, this.settings.language),
      })}`;
    }
  }

  private renderStatus(): void {
    const language = this.settings.language;
    const statusKey =
      this.statusOverrideKey ??
      (this.game.status === "ready"
        ? "status.ready"
        : this.game.status === "playing"
          ? "status.playing"
          : this.game.status === "won"
            ? "status.won"
            : "status.lost");
    this.statusText.textContent = translate(language, statusKey);
  }

  private renderBoard(): void {
    const overlayMode = this.settings.trainer.overlayMode;

    this.cellElements.forEach(({ button, value, trainer }, index) => {
      const cell = this.game.cells[index];
      const probability = this.trainerModel.probabilities.get(index)?.probability;
      const hidden = !cell.revealed;

      button.className = "cell";
      value.textContent = "";
      trainer.textContent = "";
      trainer.className = "cell-trainer";
      button.removeAttribute("data-overlay-mode");
      button.style.removeProperty("--trainer-overlay");
      button.style.removeProperty("--trainer-dot-color");
      button.classList.toggle("is-hovered", this.hoveredIndex === index);

      if (hidden) {
        button.classList.add("is-hidden");
      } else {
        button.classList.add("is-revealed");
      }

      if (index === this.pointerSession?.cellIndex && !this.pointerSession.dragging && !this.pointerSession.longPressTriggered) {
        button.classList.add("is-pressing");
      }

      if (cell.revealed && cell.adjacentMines > 0 && !cell.mine) {
        button.classList.add(`cell-number-${cell.adjacentMines}`);
        value.textContent = String(cell.adjacentMines);
      }

      if (cell.flagged) {
        button.classList.add("is-flagged");
      }

      if (cell.mine) {
        button.classList.add("is-mine");
      }

      if (cell.exploded) {
        button.classList.add("is-exploded");
      }

      if (this.game.status === "lost" && cell.flagged && !cell.mine) {
        button.classList.add("is-wrong-flag");
      }

      if (probability !== undefined && hidden && !cell.flagged && this.settings.trainer.enabled) {
        button.classList.add("has-trainer");
        button.dataset.overlayMode = overlayMode;
        const mixedColor = trainerMix(probability);
        button.style.setProperty("--trainer-overlay", mixedColor);
        button.style.setProperty("--trainer-dot-color", mixedColor);

        if (overlayMode === "percent") {
          trainer.textContent = `${Math.round(probability * 100)}`;
        } else if (overlayMode === "dots") {
          trainer.classList.add(`dots-${dotBucket(probability)}`);
        }
      }
    });
  }

  private renderCustomDialog(): void {
    this.customColumns.value = String(this.settings.customBoard.columns);
    this.customRows.value = String(this.settings.customBoard.rows);
    this.customMines.value = String(this.settings.customBoard.mines);
    this.customMines.max = String(this.settings.customBoard.columns * this.settings.customBoard.rows - 1);
  }

  private renderSettingsDialog(): void {
    this.doubleTapRange.value = String(this.settings.interaction.doubleTapMs);
    this.longPressRange.value = String(this.settings.interaction.longPressMs);
    this.dragThresholdRange.value = String(this.settings.interaction.dragThresholdPx);
    this.touchTapModeSelect.value = this.settings.interaction.touchTapMode;

    const language = this.settings.language;
    this.doubleTapValue.textContent = translate(language, "controls.milliseconds", {
      value: this.settings.interaction.doubleTapMs,
    });
    this.longPressValue.textContent = translate(language, "controls.milliseconds", {
      value: this.settings.interaction.longPressMs,
    });
    this.dragThresholdValue.textContent = translate(language, "controls.pixels", {
      value: this.settings.interaction.dragThresholdPx,
    });

    for (const option of [...this.touchTapModeSelect.options]) {
      const value = option.value as TouchTapMode;
      option.textContent = touchTapModeLabel(language, value);
    }
  }

  private renderBestTimesDialog(): void {
    const language = this.settings.language;
    const bucket = statsBucketForConfig(this.stats, this.config);
    const label =
      this.config.kind === "custom"
        ? translate(language, "difficulty.custom")
        : difficultyLabel(language, this.config.presetLevel ?? 2, this.config.classicLabel);

    this.bestTimesContext.textContent = label;
    this.bestTimesList.replaceChildren();

    if (!bucket || bucket.bestTimesMs.length === 0) {
      this.bestTimesEmpty.hidden = false;
      return;
    }

    this.bestTimesEmpty.hidden = true;
    for (const time of bucket.bestTimesMs) {
      const item = document.createElement("li");
      item.textContent = formatDuration(time);
      this.bestTimesList.append(item);
    }
  }

  private renderStatisticsDialog(): void {
    const currentBucket = statsBucketForConfig(this.stats, this.config);
    const overallBucket = this.stats.overall;
    const hasAnyStats = overallBucket.games > 0;
    this.statsEmpty.hidden = hasAnyStats;

    this.currentStatsList.replaceChildren();
    this.overallStatsList.replaceChildren();

    if (!hasAnyStats) {
      return;
    }

    this.populateStatsList(this.currentStatsList, currentBucket ?? null);
    this.populateStatsList(this.overallStatsList, overallBucket);
  }

  private populateStatsList(container: HTMLElement, bucket: { games: number; wins: number; losses: number; abandoned: number; totalDurationMs: number; fastestWinMs: number | null } | null): void {
    const language = this.settings.language;
    const rows = [
      [translate(language, "controls.totalGames"), bucket?.games ?? 0],
      [translate(language, "controls.wins"), bucket?.wins ?? 0],
      [translate(language, "controls.losses"), bucket?.losses ?? 0],
      [translate(language, "controls.abandoned"), bucket?.abandoned ?? 0],
      [
        translate(language, "controls.averageTime"),
        bucket && bucket.games > 0 ? formatDuration(bucket.totalDurationMs / bucket.games) : "—",
      ],
      [translate(language, "controls.fastestWin"), formatDuration(bucket?.fastestWinMs ?? null)],
    ];

    for (const [label, value] of rows) {
      const term = document.createElement("dt");
      term.textContent = String(label);
      const description = document.createElement("dd");
      description.textContent = String(value);
      container.append(term, description);
    }
  }

  private renderMenuState(): void {
    document.querySelectorAll<HTMLElement>(".menu-shell").forEach((shell) => {
      shell.classList.toggle("is-open", shell.dataset.menuShell === this.openMenuName);
    });

    document.querySelectorAll<HTMLElement>(".menu-entry-checkbox[data-menu-action='toggle-trainer']").forEach((entry) => {
      entry.dataset.checked = String(this.settings.trainer.enabled);
    });

    document.querySelectorAll<HTMLElement>("[data-difficulty-level]").forEach((entry) => {
      entry.dataset.checked = String(Number(entry.dataset.difficultyLevel) === this.settings.selectedDifficultyLevel);
      const level = Number(entry.dataset.difficultyLevel) as DifficultyLevel;
      const preset = PRESET_DIFFICULTIES.find((candidate) => candidate.level === level);
      if (!preset) {
        return;
      }
      entry.textContent = difficultyLabel(this.settings.language, level, preset.classicLabel);
    });

    document.querySelectorAll<HTMLElement>("[data-overlay-mode]").forEach((entry) => {
      entry.dataset.checked = String(entry.dataset.overlayMode === this.settings.trainer.overlayMode);
    });

    document.querySelectorAll<HTMLElement>("[data-theme-name]").forEach((entry) => {
      entry.dataset.checked = String(entry.dataset.themeName === this.settings.theme);
      const theme = entry.dataset.themeName as ThemeName;
      entry.textContent = themeLabel(this.settings.language, theme);
    });

    document.querySelectorAll<HTMLElement>("[data-language-code]").forEach((entry) => {
      entry.dataset.checked = String(entry.dataset.languageCode === this.settings.language);
      const language = entry.dataset.languageCode as LanguageCode;
      entry.textContent = languageLabel(this.settings.language, language);
    });
  }

  private applyTheme(): void {
    applyTheme(this.settings.theme);
  }

  private applyLanguage(): void {
    document.documentElement.lang = this.settings.language;
    applyTranslations(this.settings.language);
    document.title = `${translate(this.settings.language, "app.title")} ${translate(this.settings.language, "app.subtitle")}`;
    this.hoverHint.textContent = translate(this.settings.language, "controls.hoverHint");
  }

  private persistSettings(): void {
    writeStoredSettings(this.settings);
  }

  private toggleMenu(menuName: string): void {
    if (this.openMenuName === menuName) {
      this.closeMenus();
      return;
    }
    this.openMenu(menuName);
  }

  private openMenu(menuName: string): void {
    this.openMenuName = menuName;
    document.querySelectorAll<HTMLElement>(".menu-entry-submenu").forEach((element) => {
      element.classList.remove("is-open");
    });
    this.renderMenuState();
  }

  private closeMenus(): void {
    this.openMenuName = null;
    document.querySelectorAll<HTMLElement>(".menu-entry-submenu").forEach((element) => {
      element.classList.remove("is-open");
    });
    this.renderMenuState();
  }

  private setHoveredIndex(index: number | null): void {
    this.hoveredIndex = index;
    this.renderBoard();
  }

  private clearPendingTap(): void {
    if (!this.pendingTap) {
      return;
    }
    window.clearTimeout(this.pendingTap.timerId);
    this.pendingTap = null;
  }

  private clearLongPressTimer(): void {
    if (this.pointerSession?.holdTimerId !== null) {
      window.clearTimeout(this.pointerSession.holdTimerId);
      this.pointerSession.holdTimerId = null;
    }
  }

  private clearPressedState(): void {
    this.faceButton.classList.remove("is-pressed");
    if (this.pointerSession) {
      const cellElement = this.cellElements[this.pointerSession.cellIndex];
      cellElement?.button.classList.remove("is-pressing");
    }
  }

  private clearPointerSession(): void {
    this.clearLongPressTimer();
    this.clearPressedState();
    this.boardViewport.classList.remove("is-dragging");
    this.pointerSession = null;
    this.faceButton.classList.remove("is-pressed");
  }

  private displayPositionForCell(cell: CellState): { column: number; row: number } {
    if (!this.rotatedBoard) {
      return {
        column: cell.x,
        row: cell.y,
      };
    }

    return {
      column: this.config.rows - 1 - cell.y,
      row: cell.x,
    };
  }

  private getCellButtonFromEvent(event: Event): HTMLButtonElement | null {
    const target = event.target as HTMLElement | null;
    return (target?.closest(".cell") as HTMLButtonElement | null) ?? null;
  }
}

new MinesweeperApp().init();
