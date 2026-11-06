# Chess history explorer for historical chess games and chess database web app

Imperial Chess is a chess history explorer and chess database web app for playing, replaying, and analyzing historical chess games.

The web application runs in the browser and recreates the 19th-century conflict between the British Empire and the French Empire on a digital board. This chess history explorer enables players to test historical chess games through full chess rule validation, inspect SAN move histories, explore branching tactical lines, run dual countdown timers, and manage match records in a lightweight chess database web app.

## Architecture

The application runs as a client-side single-page web app.

Core components and libraries:

- chess.js (v1.4.0) manages board state, validates legal moves, detects check, checkmate, stalemate, and draw conditions, and generates Portable Game Notation (PGN) strings.
- react-chessboard (v5.10.0) renders the 8x8 grid, maps piece drag-and-drop actions to chess.js moves, and handles piece drop callbacks.
- React 19 (v19.2.0) and TypeScript (v5.9.3) provide component state management for timers, move history, modal dialogs, and navigation controls.
- Tailwind CSS (v4.2.1) and CSS gradients define the visual layout and faction themes.
- Lucide React (v0.576.0) supplies UI icons for game controls, settings, database actions, and navigation.
- Vite (v7.3.1) with `@vitejs/plugin-react` and `@tailwindcss/vite` compiles TypeScript and packages client assets.
- Browser localStorage stores match records as JSON strings under the key `imperial_chess_matches`.
- Asset files in `public/pieces/` contain 12 custom PNG piece sprites, and `public/battle_board.png` supplies the board background texture.

Directory layout:

- `index.html`: Web entry point and HTML shell.
- `src/main.tsx`: React application root.
- `src/App.tsx`: Top-level application component.
- `src/HistoryChess.tsx`: Main game component containing board logic, timer intervals, move navigation, and modal dialogues.
- `src/index.css`: Tailwind CSS imports, font declarations, and scrollbar styles.
- `public/`: Static image assets for chess pieces and the board.

## Setup

Prerequisites:

- Node.js 18 or later.
- pnpm package manager.

Installation steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/devsanthoshmk/chess-history-project.git
   cd chess-history-project
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

4. Build production static files:
   ```bash
   pnpm build
   ```

5. Preview the production build locally:
   ```bash
   pnpm preview
   ```

6. Run the linter:
   ```bash
   pnpm lint
   ```

## Usage

### Playing a game

1. White plays first as the British Empire with gold markers. Black plays second as the French Empire with blue markers.
2. Drag and drop any legal piece to an open or capturable square. The chess.js engine rejects illegal moves and snaps pieces back.
3. Pawns reaching the eighth rank automatically promote to queens.
4. Clocks start counting down on the first move. The clock of the active player decreases by 1 second each second.

### Reviewing move history

1. The sidebar lists all played half-moves in Standard Algebraic Notation (SAN).
2. Click any move notation in the move list to inspect the board at that turn.
3. Use the navigation buttons below the player cards:
   - Click Rewind to view the initial board state.
   - Click Chevron Left to step backward by one half-move.
   - Click Chevron Right to step forward by one half-move.
   - Click Fast Forward to return to the live match.
4. Making a new move while reviewing past moves truncates the subsequent history and creates a new branch of moves from that position.

### Saving and loading matches

1. Click the Save button (disk icon) in the header to save the current match to browser localStorage.
2. Click the Load Matches button (database icon) in the header to view saved matches.
3. Click Load next to any saved match to parse its PGN and restore the position, moves, and board state.

### Starting a new game

Click the New Game button (red circular arrow icon) in the header to reset the board, clear all moves, and restore the clocks.

## Configuration

### Time controls

Open the settings dialog by clicking the gear icon in the header. The application supports four preset timer durations:

- 3 minutes (180 seconds)
- 5 minutes (300 seconds)
- 10 minutes (600 seconds, default setting)
- 30 minutes (1800 seconds)

Selecting a new time control resets the countdown clocks for the next match.

### Local storage schema

Saved matches live in browser localStorage under the key `imperial_chess_matches`. The value is a JSON array containing up to 10 match objects. Each object contains four keys:

- `id`: Timestamp string generated with `Date.now()`.
- `date`: Localized date and time string from `new Date().toLocaleString()`.
- `pgn`: Portable Game Notation string exported by `game.pgn()`.
- `result`: Game result string (`White Won`, `Black Won`, `Draw`, or `Unfinished`).

### Build settings

- `vite.config.ts`: Configures the Vite build plugins for React and Tailwind CSS.
- `tsconfig.app.json`: Configures TypeScript compilation targeting ES2020 with strict type checking.
- `eslint.config.js`: Defines flat ESLint rules with React Hooks and React Refresh plugins.
