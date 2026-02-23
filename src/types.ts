export enum GameMode {
  CLASSIC = 'CLASSIC',
  TIME = 'TIME',
}

export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
}

export interface Block {
  id: string;
  value: number;
  row: number;
  col: number;
  isRemoving?: boolean;
}

export interface GameState {
  blocks: Block[];
  targetSum: number;
  currentSum: number;
  selectedIds: string[];
  score: number;
  level: number;
  status: GameStatus;
  mode: GameMode;
  timeLeft: number;
}

export const GRID_COLS = 6;
export const GRID_ROWS = 10;
export const INITIAL_ROWS = 4;
export const TIME_LIMIT = 10; // Seconds for Time Mode
