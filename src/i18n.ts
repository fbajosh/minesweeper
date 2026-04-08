import type { DifficultyLevel, LanguageCode, OverlayMode, ThemeName, TouchTapMode } from "./types";

type TranslationLeaf = string;
type TranslationNode = {
  [key: string]: TranslationLeaf | TranslationNode;
};

const TRANSLATIONS: Record<LanguageCode, TranslationNode> = {
  "en-US": {
    app: {
      title: "Minesweeper",
      subtitle: "Trainer",
    },
    menu: {
      game: "Game",
      training: "Training",
      help: "Help",
      new: "New",
      restart: "Restart",
      difficulty: "Difficulty",
      custom: "Custom...",
      bestTimes: "Best Times",
      statistics: "Statistics",
      enableTrainer: "Enable Trainer",
      overlayMode: "Overlay",
      settings: "Interaction Settings...",
      theme: "Theme",
      language: "Language",
      controls: "Controls",
      about: "About Minesweeper",
    },
    difficulty: {
      custom: "Custom",
      classic: {
        beginner: "Beginner",
        intermediate: "Intermediate",
        expert: "Expert",
      },
      levelLabel: "Level {level}",
    },
    overlay: {
      color: "Color Wash",
      percent: "Percent",
      dots: "Dots",
    },
    touchTapMode: {
      "single-open": "Single tap opens, double tap chords",
      "single-chord": "Single tap chords, double tap opens",
    },
    theme: {
      "xp-blue": "XP Blue",
      "xp-olive": "XP Olive",
      "xp-silver": "XP Silver",
      graphite: "Graphite",
    },
    language: {
      "en-US": "English",
      "es-ES": "Español",
    },
    status: {
      ready: "Tap a cell to begin.",
      playing: "Sweep the minefield.",
      won: "Board cleared.",
      lost: "Mine triggered.",
      panning: "Dragging to pan.",
      oversized: "Drag to pan larger custom boards.",
    },
    controls: {
      mines: "Mines",
      time: "Time",
      difficulty: "Difficulty",
      trainer: "Trainer",
      on: "On",
      off: "Off",
      remainingMines: "{count} mines remaining",
      elapsedTime: "{count} seconds elapsed",
      currentDifficulty: "{label} ({columns}x{rows}, {mines} mines)",
      customBoardSize: "Width",
      customBoardHeight: "Height",
      customBoardMines: "Mines",
      cancel: "Cancel",
      start: "Start",
      close: "Close",
      averageTime: "Average Time",
      totalGames: "Games",
      wins: "Wins",
      losses: "Losses",
      abandoned: "Abandoned",
      fastestWin: "Fastest Win",
      bestTimes: "Top Times",
      noTimes: "No wins recorded yet.",
      noStats: "No completed games recorded yet.",
      doubleTapWindow: "Double-tap window",
      longPressWindow: "Long-hold time",
      dragThreshold: "Drag sensitivity",
      tapMode: "Touch tap behavior",
      milliseconds: "{value} ms",
      pixels: "{value} px",
      restart: "Restart",
      showTrainerOverlay: "Show trainer overlay",
      titleBarMinimize: "Minimize",
      titleBarMaximize: "Maximize",
      titleBarClose: "Close",
      hoverHint: "Hover to inspect. Shift+click chords.",
      trainerMode: "Overlay: {mode}",
      languageLabel: "Language: {language}",
      themeLabel: "Theme: {theme}",
      current: "Current",
      overall: "Overall",
      board: "Minesweeper board",
    },
    dialogs: {
      customTitle: "Custom Field",
      settingsTitle: "Interaction Settings",
      bestTimesTitle: "Best Times",
      statisticsTitle: "Statistics",
      controlsTitle: "Controls",
      aboutTitle: "About Minesweeper Trainer",
    },
    about: {
      body:
        "This build recreates classic Minesweeper in a Windows XP shell, adds mobile-first controls, detailed local stats, and trainer probability plumbing.",
      credits:
        "Hosted at appmogged.com/minesweeper. Built with TypeScript and Vite for local development and static deployment.",
    },
    help: {
      controls:
        "Desktop: left-click opens, right-click flags, double-click or Shift+click chords. Touch: tap and hold to flag. Gesture timing is configurable in Training > Interaction Settings.",
      trainer:
        "Trainer mode shades hidden cells by mine probability. Color is the default overlay, with percent and dot modes available from the Training menu.",
    },
  },
  "es-ES": {
    app: {
      title: "Buscaminas",
      subtitle: "Entrenador",
    },
    menu: {
      game: "Juego",
      training: "Entrenamiento",
      help: "Ayuda",
      new: "Nuevo",
      restart: "Reiniciar",
      difficulty: "Dificultad",
      custom: "Personalizado...",
      bestTimes: "Mejores tiempos",
      statistics: "Estadisticas",
      enableTrainer: "Activar entrenador",
      overlayMode: "Superposicion",
      settings: "Ajustes de interaccion...",
      theme: "Tema",
      language: "Idioma",
      controls: "Controles",
      about: "Acerca de Buscaminas",
    },
    difficulty: {
      custom: "Personalizado",
      classic: {
        beginner: "Principiante",
        intermediate: "Intermedio",
        expert: "Experto",
      },
      levelLabel: "Nivel {level}",
    },
    overlay: {
      color: "Color",
      percent: "Porcentaje",
      dots: "Puntos",
    },
    touchTapMode: {
      "single-open": "Un toque abre, doble toque acorde",
      "single-chord": "Un toque acorde, doble toque abre",
    },
    theme: {
      "xp-blue": "XP Azul",
      "xp-olive": "XP Oliva",
      "xp-silver": "XP Plata",
      graphite: "Grafito",
    },
    language: {
      "en-US": "English",
      "es-ES": "Español",
    },
    status: {
      ready: "Toca una celda para comenzar.",
      playing: "Limpia el campo minado.",
      won: "Tablero despejado.",
      lost: "Mina detonada.",
      panning: "Arrastrando para mover.",
      oversized: "Arrastra para moverte por tableros grandes.",
    },
    controls: {
      mines: "Minas",
      time: "Tiempo",
      difficulty: "Dificultad",
      trainer: "Entrenador",
      on: "Activado",
      off: "Desactivado",
      remainingMines: "{count} minas restantes",
      elapsedTime: "{count} segundos transcurridos",
      currentDifficulty: "{label} ({columns}x{rows}, {mines} minas)",
      customBoardSize: "Ancho",
      customBoardHeight: "Alto",
      customBoardMines: "Minas",
      cancel: "Cancelar",
      start: "Empezar",
      close: "Cerrar",
      averageTime: "Tiempo medio",
      totalGames: "Partidas",
      wins: "Victorias",
      losses: "Derrotas",
      abandoned: "Abandonadas",
      fastestWin: "Victoria mas rapida",
      bestTimes: "Mejores tiempos",
      noTimes: "Todavia no hay victorias registradas.",
      noStats: "Todavia no hay partidas completadas.",
      doubleTapWindow: "Ventana de doble toque",
      longPressWindow: "Tiempo de pulsacion larga",
      dragThreshold: "Sensibilidad de arrastre",
      tapMode: "Comportamiento tactil",
      milliseconds: "{value} ms",
      pixels: "{value} px",
      restart: "Reiniciar",
      showTrainerOverlay: "Mostrar superposicion del entrenador",
      titleBarMinimize: "Minimizar",
      titleBarMaximize: "Maximizar",
      titleBarClose: "Cerrar",
      hoverHint: "Pasa el cursor para inspeccionar. Mayus+clic hace acorde.",
      trainerMode: "Superposicion: {mode}",
      languageLabel: "Idioma: {language}",
      themeLabel: "Tema: {theme}",
      current: "Actual",
      overall: "Global",
      board: "Tablero de Buscaminas",
    },
    dialogs: {
      customTitle: "Campo personalizado",
      settingsTitle: "Ajustes de interaccion",
      bestTimesTitle: "Mejores tiempos",
      statisticsTitle: "Estadisticas",
      controlsTitle: "Controles",
      aboutTitle: "Acerca de Buscaminas Entrenador",
    },
    about: {
      body:
        "Esta version recrea el Buscaminas clasico en una carcasa de Windows XP y agrega controles pensados para movil, estadisticas locales detalladas y la base del entrenador de probabilidades.",
      credits:
        "Alojado en appmogged.com/minesweeper. Construido con TypeScript y Vite para desarrollo local y despliegue estatico.",
    },
    help: {
      controls:
        "Escritorio: clic izquierdo abre, clic derecho marca, doble clic o Mayus+clic hace acorde. Tactil: manten pulsado para marcar. El tiempo de gestos se configura en Entrenamiento > Ajustes de interaccion.",
      trainer:
        "El modo entrenador colorea las celdas ocultas segun la probabilidad de mina. Desde el menu de Entrenamiento puedes cambiar entre color, porcentaje y puntos.",
    },
  },
};

function lookup(language: LanguageCode, key: string): string | null {
  const parts = key.split(".");
  let current: TranslationLeaf | TranslationNode | undefined = TRANSLATIONS[language];

  for (const part of parts) {
    if (!current || typeof current === "string") {
      return null;
    }
    current = current[part];
  }

  return typeof current === "string" ? current : null;
}

export function translate(language: LanguageCode, key: string, params?: Record<string, string | number>): string {
  const template = lookup(language, key) ?? lookup("en-US", key) ?? key;

  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, token: string) => String(params[token] ?? `{${token}}`));
}

export function applyTranslations(language: LanguageCode, root: ParentNode = document): void {
  const textNodes = root.querySelectorAll<HTMLElement>("[data-i18n]");
  for (const node of textNodes) {
    const key = node.dataset.i18n;
    if (!key) {
      continue;
    }
    node.textContent = translate(language, key);
  }

  const ariaNodes = root.querySelectorAll<HTMLElement>("[data-i18n-aria-label]");
  for (const node of ariaNodes) {
    const key = node.dataset.i18nAriaLabel;
    if (!key) {
      continue;
    }
    node.setAttribute("aria-label", translate(language, key));
  }
}

export function themeLabel(language: LanguageCode, theme: ThemeName): string {
  return translate(language, `theme.${theme}`);
}

export function languageLabel(language: LanguageCode, target: LanguageCode): string {
  return translate(language, `language.${target}`);
}

export function overlayLabel(language: LanguageCode, mode: OverlayMode): string {
  return translate(language, `overlay.${mode}`);
}

export function touchTapModeLabel(language: LanguageCode, mode: TouchTapMode): string {
  return translate(language, `touchTapMode.${mode}`);
}

export function difficultyLabel(
  language: LanguageCode,
  level: DifficultyLevel,
  classicLabel?: "beginner" | "intermediate" | "expert",
): string {
  if (!classicLabel) {
    return translate(language, "difficulty.levelLabel", { level });
  }

  return `${level} (${translate(language, `difficulty.classic.${classicLabel}`)})`;
}
