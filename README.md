# Minesweeper Trainer

Classic Minesweeper rebuilt as an interactive web app with a Windows XP shell, mobile-first controls, trainer overlays, and local stat tracking.

Live app: [appmogged.com/minesweeper](https://appmogged.com/minesweeper/)

Sister app: [appmogged.com/connect4](https://appmogged.com/connect4/)

## Overview

This project aims to stay visually and behaviorally close to classic Microsoft Minesweeper while adding a few modern conveniences:

- mobile portrait support, including rotated wide boards
- touch-first interaction tuning for fast play
- trainer overlays for mine probability
- local stats and game-history logging
- action-based sound effects
- theme support
- language support

The app is built as a static Vite site and deployed to a GCP-hosted VM via GitHub Actions.

## Features

- first-click-safe mine placement on new games
- standard Minesweeper rules, including chording
- difficulty levels `1-10`, with classic Microsoft anchors at:
  - `Level 2 (Beginner)`
  - `Level 5 (Intermediate)`
  - `Level 8 (Expert)`
- custom boards up to `60x32`
- restart with the same seed
- undo last move
  - can undo a loss
  - the original loss still counts in stats
  - after undo, no further stats are recorded for that session
- XP-style title bar, menu bar, counters, and playfield chrome
- multiple themes:
  - `Blue`
  - `Olive Green`
  - `Silver`
  - `Astronomer`
  - `Mogged`
- trainer overlay modes:
  - `Color Wash`
  - `Percent`
  - `Dots`
- sound effects for:
  - opening cells
  - placing flags
  - wins
  - losses
  - resets
- local best times and statistics
- IndexedDB-backed detailed game records and action history

## Controls

### Desktop

- `Left click`: open
- `Right click`: flag
- `Double click`: chord
- `Shift + click`: chord
- `Hover`: inspect cell border
- `Click and drag off a cell`: cancel the press
- `Drag title bar`: move window
- `Drag lower-right corner area`: proportionally resize window

### Touch

- `Tap`: open or chord, depending on settings
- `Double tap`: open or chord, depending on settings
- `Long hold`: flag
- `Drag`: pan oversized boards

Interaction timing is configurable in `Training > Settings...`.

## Trainer

Trainer mode adds probability hints to hidden cells. It is designed as an on-demand aid rather than an always-on solver overlay.

- enable trainer from the `Training` menu
- hold the eye face button to reveal the selected trainer overlay
- release to hide it

The current implementation uses an exact constrained frontier solve for bounded components, with fallback behavior for larger or inconsistent states.

## Sound

The app includes lightweight action-confirmed sound effects:

- `open`: after a confirmed open or chord action
- `flagged`: when a flag is placed
- `win`: when the board is cleared
- `lose`: when a mine is hit
- `reset`: when starting a new game or restarting

Sounds are attached to completed actions, not pointer-down events, so canceled drags do not trigger them.

## Stats and History

The app records:

- summary stats in local storage
- detailed per-game records in IndexedDB
- per-action history including gesture type, timing, board state changes, and local neighbor snapshots

Stats are only counted for clean runs:

- restart count must be `0`
- once `Undo` is used, no additional stats are recorded for that session

## Tech Stack

- TypeScript
- Vite
- static asset-based XP UI styling
- localStorage for settings and summary stats
- IndexedDB for detailed game history

## Local Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the built site locally:

```bash
npm run preview
```

## Deployment

Production deploys are handled by [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).

The build is synced over SSH to the production VM using these GitHub environment secrets:

- `DEPLOY_SSH_HOST`
- `DEPLOY_SSH_USER`
- `DEPLOY_SSH_PORT`
- `DEPLOY_SSH_KEY`
- `DEPLOY_SSH_KNOWN_HOSTS`
- `DEPLOY_TARGET_DIR`

The Vite production base path is `/minesweeper/`, configured in [`vite.config.mjs`](./vite.config.mjs).

## Project Structure

- [`src/index.html`](./src/index.html): app shell and dialogs
- [`src/main.ts`](./src/main.ts): UI wiring, input handling, menus, trainer display, desktop window behavior
- [`src/game.ts`](./src/game.ts): core Minesweeper rules and state transitions
- [`src/trainer.ts`](./src/trainer.ts): probability model
- [`src/theme.ts`](./src/theme.ts): theme token definitions
- [`src/i18n.ts`](./src/i18n.ts): language strings and labels
- [`src/stats.ts`](./src/stats.ts): summary stats
- [`src/storage.ts`](./src/storage.ts): persistent game record storage
- [`src/style.css`](./src/style.css): XP-styled UI and board rendering

## Notes

- This project intentionally aims for a very close visual match to classic Minesweeper and Windows XP.
- Assets and fonts in this repo are used to support that recreation.
