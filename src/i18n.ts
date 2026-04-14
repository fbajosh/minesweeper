import type { DifficultyLevel, LanguageCode, OverlayMode, ThemeName } from "./types";

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
      new: "New game",
      restart: "Restart game",
      undo: "Undo",
      difficulty: "Difficulty",
      sound: "Sound",
      custom: "Custom...",
      bestTimes: "Best Times",
      statistics: "Statistics",
      basicStatistics: "Basic statistics",
      advancedStatistics: "Advanced statistics",
      enableTrainer: "Enable Trainer",
      overlayMode: "Overlay",
      settings: "Additional settings...",
      theme: "Theme",
      language: "Language",
      controls: "Controls",
      about: "About Minesweeper",
      credits: "Credits",
      appmogged: "Appmogged",
      refresh: "Refresh",
      exit: "Exit",
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
      color: "Probability Map",
      percent: "Percent",
      dots: "Dots",
      bestMove: "Best Move",
    },
    theme: {
      "xp-blue": "Blue",
      "xp-olive": "Olive Green",
      "xp-silver": "Silver",
      astronomer: "Astronomer",
      mogged: "Mogged",
    },
    language: {
      "en-US": "English",
      "es-ES": "Español",
      "pt-BR": "Português",
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
      trainerUses: "Trainer uses",
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
      advanced: "Advanced",
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
      singleClickChord: "Single-click opened numbers",
      milliseconds: "{value} ms",
      pixels: "{value} px",
      restart: "Restart",
      showTrainerOverlay: "Show trainer overlay",
      titleBarMinimize: "Minimize",
      titleBarMaximize: "Maximize",
      titleBarClose: "Close",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
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
      settingsTitle: "Additional Settings",
      bestTimesTitle: "Best Times",
      statisticsTitle: "Statistics",
      advancedStatisticsTitle: "Advanced Statistics",
      controlsTitle: "Controls",
      aboutTitle: "About Minesweeper Trainer",
      creditsTitle: "Credits",
    },
    about: {
      body:
        "This build recreates classic Minesweeper in a Windows XP shell, adds mobile-first controls, detailed local stats, and trainer probability plumbing.",
      credits:
        "Hosted at appmogged.com/minesweeper. Built with TypeScript and Vite for local development and static deployment.",
      version: "Build version: {version}",
    },
    help: {
      controls:
        "Desktop: left-click opens, right-click flags, double-click or Shift+click chords. Touch: tap and hold to flag. Gesture timing is configurable in Game > Additional settings.",
      trainer:
        "Trainer mode shades hidden cells by mine probability. Probability Map is the default overlay, with percent, dot, and Best Move modes available from the Training menu.",
    },
    advancedStats: {
      noteReady: "Current game/session metrics. Board difficulty is available after the minefield is generated.",
      noteWaiting: "Open a cell to generate the minefield and board difficulty metrics.",
      cps: "CPS",
      cpsTip: "Clicks per second: total completed click attempts divided by elapsed time.",
      threeBv: "3BV",
      threeBvTip: "Bechtel's Board Benchmark Value: minimum left clicks required to clear the board without flags.",
      threeBvPerSecond: "3BV/s",
      threeBvPerSecondTip: "Solving rate: 3BV divided by elapsed time.",
      ios: "IOS",
      iosTip: "Index of Speed: log(3BV) divided by log(time).",
      rqp: "RQP",
      rqpTip: "Rapport Qualite Prix using the configured formula: time divided by 3BV/s.",
      ioe: "IOE",
      ioeTip: "Index of Efficiency: 3BV divided by total clicks.",
      correctness: "Correctness",
      correctnessTip: "Effective clicks divided by total clicks. Effective clicks changed the board.",
      throughput: "Throughput",
      throughputTip: "3BV divided by effective clicks.",
      zini: "ZiNi",
      ziniTip: "Flag-assisted board difficulty. Greedy, random, and human ZiNi solvers are planned.",
    },
    credits: {
      app:
        "Minesweeper Trainer is an AppMogged game built for classic Minesweeper play, mobile controls, local stats, and trainer overlays.",
      inspiration: "Visual direction is inspired by classic Microsoft Minesweeper and the Windows XP Luna interface.",
      fonts: "Counter digits use DSEG by keshikan. Board numbers use the Mine Sweeper font from FontStruct.",
      tools: "Built with TypeScript and Vite, with static deployment to appmogged.com/minesweeper.",
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
      new: "Nueva partida",
      restart: "Reiniciar partida",
      undo: "Deshacer",
      difficulty: "Dificultad",
      sound: "Sonido",
      custom: "Personalizado...",
      bestTimes: "Mejores tiempos",
      statistics: "Estadisticas",
      basicStatistics: "Estadisticas basicas",
      advancedStatistics: "Estadisticas avanzadas",
      enableTrainer: "Activar entrenador",
      overlayMode: "Superposicion",
      settings: "Ajustes adicionales...",
      theme: "Tema",
      language: "Idioma",
      controls: "Controles",
      about: "Acerca de Buscaminas",
      credits: "Creditos",
      appmogged: "Appmogged",
      refresh: "Actualizar",
      exit: "Salir",
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
      color: "Mapa de probabilidad",
      percent: "Porcentaje",
      dots: "Puntos",
      bestMove: "Mejor jugada",
    },
    theme: {
      "xp-blue": "Azul",
      "xp-olive": "Verde oliva",
      "xp-silver": "Plata",
      astronomer: "Astronomer",
      mogged: "Mogged",
    },
    language: {
      "en-US": "English",
      "es-ES": "Español",
      "pt-BR": "Português",
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
      trainerUses: "Usos del entrenador",
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
      advanced: "Avanzado",
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
      singleClickChord: "Un clic en numeros abiertos",
      milliseconds: "{value} ms",
      pixels: "{value} px",
      restart: "Reiniciar",
      showTrainerOverlay: "Mostrar superposicion del entrenador",
      titleBarMinimize: "Minimizar",
      titleBarMaximize: "Maximizar",
      titleBarClose: "Cerrar",
      zoomIn: "Acercar",
      zoomOut: "Alejar",
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
      settingsTitle: "Ajustes adicionales",
      bestTimesTitle: "Mejores tiempos",
      statisticsTitle: "Estadisticas",
      advancedStatisticsTitle: "Estadisticas avanzadas",
      controlsTitle: "Controles",
      aboutTitle: "Acerca de Buscaminas Entrenador",
      creditsTitle: "Creditos",
    },
    about: {
      body:
        "Esta version recrea el Buscaminas clasico en una carcasa de Windows XP y agrega controles pensados para movil, estadisticas locales detalladas y la base del entrenador de probabilidades.",
      credits:
        "Alojado en appmogged.com/minesweeper. Construido con TypeScript y Vite para desarrollo local y despliegue estatico.",
      version: "Version de compilacion: {version}",
    },
    help: {
      controls:
        "Escritorio: clic izquierdo abre, clic derecho marca, doble clic o Mayus+clic hace acorde. Tactil: manten pulsado para marcar. El tiempo de gestos se configura en Juego > Ajustes adicionales.",
      trainer:
        "El modo entrenador colorea las celdas ocultas segun la probabilidad de mina. Desde el menu de Entrenamiento puedes cambiar entre mapa de probabilidad, porcentaje, puntos y mejor jugada.",
    },
    advancedStats: {
      noteReady: "Metricas de la partida/sesion actual. La dificultad del tablero esta disponible despues de generar las minas.",
      noteWaiting: "Abre una celda para generar las minas y las metricas de dificultad del tablero.",
      cps: "CPS",
      cpsTip: "Clics por segundo: intentos de clic completados divididos por el tiempo.",
      threeBv: "3BV",
      threeBvTip: "Bechtel's Board Benchmark Value: clics izquierdos minimos para despejar el tablero sin banderas.",
      threeBvPerSecond: "3BV/s",
      threeBvPerSecondTip: "Ritmo de resolucion: 3BV dividido por el tiempo.",
      ios: "IOS",
      iosTip: "Index of Speed: log(3BV) dividido por log(tiempo).",
      rqp: "RQP",
      rqpTip: "Rapport Qualite Prix con la formula configurada: tiempo dividido por 3BV/s.",
      ioe: "IOE",
      ioeTip: "Index of Efficiency: 3BV dividido por clics totales.",
      correctness: "Correctness",
      correctnessTip: "Clics efectivos divididos por clics totales. Un clic efectivo cambia el tablero.",
      throughput: "Throughput",
      throughputTip: "3BV dividido por clics efectivos.",
      zini: "ZiNi",
      ziniTip: "Dificultad con banderas. Los solvers ZiNi greedy, aleatorio y humano estan planificados.",
    },
    credits: {
      app:
        "Buscaminas Entrenador es un juego de AppMogged creado para el Buscaminas clasico, controles moviles, estadisticas locales y capas de entrenador.",
      inspiration: "La direccion visual esta inspirada en el Buscaminas clasico de Microsoft y la interfaz Windows XP Luna.",
      fonts: "Los digitos de los contadores usan DSEG de keshikan. Los numeros del tablero usan la fuente Mine Sweeper de FontStruct.",
      tools: "Creado con TypeScript y Vite, con despliegue estatico en appmogged.com/minesweeper.",
    },
  },
  "pt-BR": {
    app: {
      title: "Campo Minado",
      subtitle: "Trainer",
    },
    menu: {
      game: "Jogo",
      training: "Treino",
      help: "Ajuda",
      new: "Novo jogo",
      restart: "Reiniciar jogo",
      undo: "Desfazer",
      difficulty: "Dificuldade",
      sound: "Som",
      custom: "Personalizado...",
      bestTimes: "Melhores tempos",
      statistics: "Estatisticas",
      basicStatistics: "Estatisticas basicas",
      advancedStatistics: "Estatisticas avancadas",
      enableTrainer: "Ativar trainer",
      overlayMode: "Overlay",
      settings: "Ajustes adicionais...",
      theme: "Tema",
      language: "Idioma",
      controls: "Controles",
      about: "Sobre o Campo Minado",
      credits: "Creditos",
      appmogged: "Appmogged",
      refresh: "Atualizar",
      exit: "Sair",
    },
    difficulty: {
      custom: "Personalizado",
      classic: {
        beginner: "Iniciante",
        intermediate: "Intermediario",
        expert: "Especialista",
      },
      levelLabel: "Nivel {level}",
    },
    overlay: {
      color: "Mapa de probabilidade",
      percent: "Porcentagem",
      dots: "Pontos",
      bestMove: "Melhor jogada",
    },
    theme: {
      "xp-blue": "Blue",
      "xp-olive": "Olive Green",
      "xp-silver": "Silver",
      astronomer: "Astronomer",
      mogged: "Mogged",
    },
    language: {
      "en-US": "English",
      "es-ES": "Español",
      "pt-BR": "Português",
    },
    status: {
      ready: "Toque em uma celula para comecar.",
      playing: "Limpe o campo minado.",
      won: "Tabuleiro limpo.",
      lost: "Mina acionada.",
      panning: "Arrastando para mover.",
      oversized: "Arraste para mover em tabuleiros grandes.",
    },
    controls: {
      mines: "Minas",
      time: "Tempo",
      difficulty: "Dificuldade",
      trainer: "Trainer",
      trainerUses: "Usos do trainer",
      on: "Ligado",
      off: "Desligado",
      remainingMines: "{count} minas restantes",
      elapsedTime: "{count} segundos decorridos",
      currentDifficulty: "{label} ({columns}x{rows}, {mines} minas)",
      customBoardSize: "Largura",
      customBoardHeight: "Altura",
      customBoardMines: "Minas",
      cancel: "Cancelar",
      start: "Iniciar",
      close: "Fechar",
      advanced: "Avancado",
      averageTime: "Tempo medio",
      totalGames: "Jogos",
      wins: "Vitorias",
      losses: "Derrotas",
      abandoned: "Abandonados",
      fastestWin: "Vitoria mais rapida",
      bestTimes: "Melhores tempos",
      noTimes: "Ainda nao ha vitorias registradas.",
      noStats: "Ainda nao ha jogos concluidos registrados.",
      doubleTapWindow: "Janela de toque duplo",
      longPressWindow: "Tempo de pressao longa",
      dragThreshold: "Sensibilidade de arraste",
      singleClickChord: "Clique unico em numeros abertos",
      milliseconds: "{value} ms",
      pixels: "{value} px",
      restart: "Reiniciar",
      showTrainerOverlay: "Mostrar overlay do trainer",
      titleBarMinimize: "Minimizar",
      titleBarMaximize: "Maximizar",
      titleBarClose: "Fechar",
      zoomIn: "Aumentar zoom",
      zoomOut: "Diminuir zoom",
      hoverHint: "Passe o mouse para inspecionar. Shift+clique faz acorde.",
      trainerMode: "Overlay: {mode}",
      languageLabel: "Idioma: {language}",
      themeLabel: "Tema: {theme}",
      current: "Atual",
      overall: "Geral",
      board: "Tabuleiro de Campo Minado",
    },
    dialogs: {
      customTitle: "Campo personalizado",
      settingsTitle: "Ajustes adicionais",
      bestTimesTitle: "Melhores tempos",
      statisticsTitle: "Estatisticas",
      advancedStatisticsTitle: "Estatisticas avancadas",
      controlsTitle: "Controles",
      aboutTitle: "Sobre o Campo Minado Trainer",
      creditsTitle: "Creditos",
    },
    about: {
      body:
        "Esta versao recria o Campo Minado classico em uma casca de Windows XP e adiciona controles pensados para celular, estatisticas locais detalhadas e a base do trainer de probabilidades.",
      credits:
        "Hospedado em appmogged.com/minesweeper. Feito com TypeScript e Vite para desenvolvimento local e deploy estatico.",
      version: "Versao da compilacao: {version}",
    },
    help: {
      controls:
        "Desktop: clique esquerdo abre, clique direito marca, clique duplo ou Shift+clique faz acorde. No toque: segure para marcar. O tempo dos gestos pode ser ajustado em Jogo > Ajustes adicionais.",
      trainer:
        "O modo trainer colore as celulas ocultas pela probabilidade de mina. No menu Treino voce pode escolher mapa de probabilidade, porcentagem, pontos ou melhor jogada.",
    },
    advancedStats: {
      noteReady: "Metricas do jogo/sessao atual. A dificuldade do tabuleiro fica disponivel depois que as minas sao geradas.",
      noteWaiting: "Abra uma celula para gerar as minas e as metricas de dificuldade do tabuleiro.",
      cps: "CPS",
      cpsTip: "Cliques por segundo: tentativas de clique concluidas divididas pelo tempo.",
      threeBv: "3BV",
      threeBvTip: "Bechtel's Board Benchmark Value: cliques esquerdos minimos para limpar o tabuleiro sem bandeiras.",
      threeBvPerSecond: "3BV/s",
      threeBvPerSecondTip: "Ritmo de solucao: 3BV dividido pelo tempo.",
      ios: "IOS",
      iosTip: "Index of Speed: log(3BV) dividido por log(tempo).",
      rqp: "RQP",
      rqpTip: "Rapport Qualite Prix com a formula configurada: tempo dividido por 3BV/s.",
      ioe: "IOE",
      ioeTip: "Index of Efficiency: 3BV dividido por cliques totais.",
      correctness: "Correctness",
      correctnessTip: "Cliques efetivos divididos por cliques totais. Um clique efetivo muda o tabuleiro.",
      throughput: "Throughput",
      throughputTip: "3BV dividido por cliques efetivos.",
      zini: "ZiNi",
      ziniTip: "Dificuldade com bandeiras. Solvers ZiNi greedy, aleatorio e humano estao planejados.",
    },
    credits: {
      app:
        "Campo Minado Trainer e um jogo AppMogged feito para Campo Minado classico, controles moveis, estatisticas locais e overlays de trainer.",
      inspiration: "A direcao visual e inspirada no Campo Minado classico da Microsoft e na interface Windows XP Luna.",
      fonts: "Os digitos dos contadores usam DSEG de keshikan. Os numeros do tabuleiro usam a fonte Mine Sweeper do FontStruct.",
      tools: "Feito com TypeScript e Vite, com deploy estatico em appmogged.com/minesweeper.",
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

export function difficultyLabel(
  language: LanguageCode,
  level: DifficultyLevel,
  classicLabel?: "beginner" | "intermediate" | "expert",
): string {
  if (!classicLabel) {
    return translate(language, "difficulty.levelLabel", { level });
  }

  return `${translate(language, "difficulty.levelLabel", { level })} (${translate(language, `difficulty.classic.${classicLabel}`)})`;
}
