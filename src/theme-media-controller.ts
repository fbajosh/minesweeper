import flaggedSoundUrl from "./assets/sounds/flagged.mp3";
import loseSoundUrl from "./assets/sounds/lose.mp3";
import openSoundUrl from "./assets/sounds/open.mp3";
import resetSoundUrl from "./assets/sounds/reset.mp3";
import winSoundUrl from "./assets/sounds/win.mp3";
import type { ThemeName } from "./types";

export type SoundEffectKey = "flagged" | "lose" | "open" | "reset" | "win";

type MoggedBackgroundController = {
  setEnabled(enabled: boolean): void;
};

type MoggedThemeResources = {
  effect: HTMLAudioElement;
  music: HTMLAudioElement;
  background: MoggedBackgroundController;
};

export interface ThemeMediaSyncOptions {
  allowPlayback: boolean;
  boardHasStarted: boolean;
  soundEnabled: boolean;
}

function createSound(url: string): HTMLAudioElement {
  const audio = new Audio(url);
  audio.preload = "auto";
  return audio;
}

export function createThemeMediaController(themeBackground: HTMLCanvasElement) {
  const sounds: Record<SoundEffectKey, HTMLAudioElement> = {
    flagged: createSound(flaggedSoundUrl),
    lose: createSound(loseSoundUrl),
    open: createSound(openSoundUrl),
    reset: createSound(resetSoundUrl),
    win: createSound(winSoundUrl),
  };

  let latestTheme: ThemeName = "xp-blue";
  let latestOptions: ThemeMediaSyncOptions = {
    allowPlayback: false,
    boardHasStarted: false,
    soundEnabled: true,
  };
  let moggedThemeResources: MoggedThemeResources | null = null;
  let moggedThemeResourcesPromise: Promise<MoggedThemeResources> | null = null;

  function stopMoggedMusic(reset = true): void {
    const music = moggedThemeResources?.music;
    if (!music) {
      return;
    }

    music.pause();
    if (reset) {
      music.currentTime = 0;
    }
  }

  async function ensureMoggedThemeResources(): Promise<MoggedThemeResources> {
    if (moggedThemeResources) {
      return moggedThemeResources;
    }

    if (moggedThemeResourcesPromise) {
      return moggedThemeResourcesPromise;
    }

    moggedThemeResourcesPromise = (async () => {
      const [
        { default: moggEffectUrl },
        { default: moggedMusicUrl },
        { createMoggedBackground },
      ] = await Promise.all([
        import("./assets/sounds/mogg.mp3"),
        import("./assets/sounds/appmogged-music.mp3"),
        import("./mogged-background"),
      ]);

      const effect = createSound(moggEffectUrl);
      const music = createSound(moggedMusicUrl);
      music.loop = true;
      music.volume = 0.45;

      const resources: MoggedThemeResources = {
        effect,
        music,
        background: createMoggedBackground(themeBackground),
      };

      moggedThemeResources = resources;
      moggedThemeResourcesPromise = null;
      applyThemeState();
      return resources;
    })().catch((error) => {
      moggedThemeResourcesPromise = null;
      throw error;
    });

    return moggedThemeResourcesPromise;
  }

  function playBaseSoundEffect(effect: SoundEffectKey): void {
    const audio = sounds[effect];
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Ignore playback failures, usually due to browser autoplay policy.
    });
  }

  async function playMoggedSoundEffect(): Promise<void> {
    try {
      const resources = await ensureMoggedThemeResources();
      if (!latestOptions.soundEnabled || latestTheme !== "mogged") {
        return;
      }

      resources.effect.pause();
      resources.effect.currentTime = 0;
      void resources.effect.play().catch(() => {
        // Ignore playback failures, usually due to browser autoplay policy.
      });
    } catch {
      // Ignore lazy-load failures and keep the app usable.
    }
  }

  function applyThemeState(): void {
    if (latestTheme !== "mogged") {
      moggedThemeResources?.background.setEnabled(false);
      stopMoggedMusic();
      return;
    }

    if (!moggedThemeResources) {
      void ensureMoggedThemeResources().catch(() => {
        // Ignore lazy-load failures and fall back silently.
      });
      return;
    }

    moggedThemeResources.background.setEnabled(true);

    if (!latestOptions.allowPlayback || !latestOptions.soundEnabled || !latestOptions.boardHasStarted) {
      stopMoggedMusic();
      return;
    }

    if (!moggedThemeResources.music.paused) {
      return;
    }

    void moggedThemeResources.music.play().catch(() => {
      // Playback may be blocked until a user gesture.
    });
  }

  return {
    playSoundEffect(effect: SoundEffectKey, options: { soundEnabled: boolean; theme: ThemeName }): void {
      latestTheme = options.theme;
      latestOptions = {
        ...latestOptions,
        soundEnabled: options.soundEnabled,
      };

      if (!options.soundEnabled) {
        return;
      }

      if (options.theme === "mogged") {
        void playMoggedSoundEffect();
        return;
      }

      playBaseSoundEffect(effect);
    },

    syncTheme(theme: ThemeName, options: ThemeMediaSyncOptions): void {
      latestTheme = theme;
      latestOptions = options;
      applyThemeState();
    },
  };
}
