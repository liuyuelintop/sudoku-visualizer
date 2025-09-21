/**
 * @fileoverview Sudoku Type Definitions - Core Type System
 *
 * Comprehensive type definitions for the Sudoku visualizer application.
 * Provides both backward-compatible legacy types and enhanced type-safe versions
 * for improved developer experience and runtime safety.
 *
 * @module types/sudoku
 * @version 1.0.0
 * @since Phase-2-Architecture-Finalization
 *
 * @architecture
 * - Dual type system: legacy compatibility + modern type safety
 * - Immutable-first design with readonly modifiers
 * - Runtime type guards for validation
 * - Complete interface definitions for all components
 *
 * @example
 * ```typescript
 * import { Board, isValidBoard, SudokuController } from './types/sudoku';
 *
 * // Type-safe board creation
 * const board: Board = Array(9).fill(null).map(() => Array(9).fill('.'));
 *
 * // Runtime validation
 * if (isValidBoard(userInput)) {
 *   // Safe to use as Board
 * }
 * ```
 */

// Legacy type definitions maintained for backward compatibility
export type Cell = string; // "." or "1".."9" - keeping original for compatibility
export type Board = Cell[][]; // 9x9 - keeping original structure

/**
 * Enhanced type definitions for better type safety and validation
 */

/** String representation of digits 1-9 for board display */
export type DigitChar = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

/** Empty cell representation */
export type EmptyCell = '.';

/** Strict cell type combining digits and empty - use for validation */
export type ValidCell = DigitChar | EmptyCell;

/**
 * Numeric representations for calculations and algorithm logic
 * Use this for mathematical operations, use DigitChar for display
 */
export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * Sudoku dimension constants and utilities
 */

/** Standard Sudoku board size (9x9) */
export const SUDOKU_SIZE = 9 as const;

/** Size of each 3x3 box within the Sudoku */
export const BOX_SIZE = 3 as const;

/** Type representing the board size for type checking */
export type SudokuSize = typeof SUDOKU_SIZE;

/** Type representing the box size for type checking */
export type BoxSize = typeof BOX_SIZE;

/**
 * Core data structures for game state representation
 */

/**
 * Represents a position on the Sudoku board
 * @property r - Row index (0-8)
 * @property c - Column index (0-8)
 */
export type Position = {
  readonly r: number;
  readonly c: number;
};

/**
 * Represents a digit being attempted at a specific position
 * Used during the solving process to track current attempt
 * @property r - Row index (0-8)
 * @property c - Column index (0-8)
 * @property d - Digit being tried (1-9)
 */
export type TryingState = {
  readonly r: number;
  readonly c: number;
  readonly d: number;
};

/**
 * MRV (Minimum Remaining Values) algorithm data structures
 */

/**
 * Represents an item in the MRV scan process
 * Used to visualize how the algorithm selects the next cell to solve
 * @property i - Index in the empties array
 * @property r - Row position (0-8)
 * @property c - Column position (0-8)
 * @property count - Number of valid candidates for this cell
 * @property bestIndex - Index of the current best cell
 * @property bestCount - Candidate count of the current best cell
 */
export type MRVScanItem = {
  readonly i: number;
  readonly r: number;
  readonly c: number;
  readonly count: number;
  readonly bestIndex: number;
  readonly bestCount: number;
};

/**
 * Enhanced representation of an empty cell with candidate information
 * @property r - Row position (0-8)
 * @property c - Column position (0-8)
 * @property count - Number of valid candidates remaining
 * @property filled - Whether this cell has been filled (for animation)
 */
export type EmptyCellInfo = {
  readonly r: number;
  readonly c: number;
  readonly count: number;
  readonly filled: boolean;
};

/**
 * Represents a swap operation in the MRV selection process
 * Used when a better cell is found during the scan
 * @property k - Current frontier index in empties array
 * @property best - Index of the best cell found so far
 */
export type SwapState = {
  readonly k: number;
  readonly best: number;
};

/**
 * Constraint tracking for Sudoku validation
 * Tracks which digits are used in each row, column, and 3x3 box
 * @property rows - rows[r][d-1] = true if digit d is used in row r
 * @property cols - cols[c][d-1] = true if digit d is used in column c
 * @property boxes - boxes[boxId][d-1] = true if digit d is used in box
 */
export type ConstraintUsage = {
  rows: boolean[][];
  cols: boolean[][];
  boxes: boolean[][];
};

/**
 * Union type representing all possible steps in the solving process
 * Each step type corresponds to a different phase of the MRV algorithm
 */
export type SolverStep =
  | {
      /** Selecting the next cell to solve using MRV heuristic */
      type: 'selectCell';
      /** Index of selected cell in empties array */
      index: number;
      /** Row position of selected cell */
      r: number;
      /** Column position of selected cell */
      c: number;
      /** Valid candidates for this cell */
      candidates: number[];
      /** Current state of all empty cells */
      empties: Array<{ r: number; c: number; count: number; filled: boolean }>;
      /** Current constraint usage state */
      usage: ConstraintUsage;
      /** MRV scan visualization data */
      scan: MRVScanItem[];
      /** Swap operation data (if any) */
      swap: SwapState | null;
    }
  | {
      /** Attempting to place a specific digit */
      type: 'tryDigit';
      r: number;
      c: number;
      d: number;
    }
  | {
      /** Successfully placing a digit */
      type: 'place';
      r: number;
      c: number;
      d: number;
    }
  | {
      /** Backtracking from an invalid placement */
      type: 'backtrack';
      r: number;
      c: number;
      d: number;
    }
  | {
      /** Puzzle successfully solved */
      type: 'solved';
    };

export type SolverSnapshot = {
  readonly idx: number;
  readonly event: string;
  readonly board: Board;
  readonly highlight: Position | null;
  readonly trying: TryingState | null;
  readonly candidates: number[];
  readonly empties: Array<{ r: number; c: number; count: number; filled: boolean }>;
  readonly usage: ConstraintUsage | null;
  readonly note?: string;
  readonly scan?: MRVScanItem[];
  readonly swap?: SwapState | null;
};

export type ValidationIssue = {
  readonly type: 'row' | 'col' | 'box' | 'char' | 'shape';
  readonly digit?: number;
  readonly positions?: Array<{ r: number; c: number }>;
  readonly message: string;
};

export type SolverMetrics = {
  readonly steps: number;
  readonly selects: number;
  readonly tries: number;
  readonly places: number;
  readonly backtracks: number;
  readonly nodes: number;
};

// Complete Controller interface for useSudokuController
export interface SudokuController {
  // Solver state
  board: Board;
  running: boolean;
  finished: boolean;
  highlight: Position | null;
  trying: TryingState | null;
  candidates: number[];
  emptiesView: Array<{ r: number; c: number; count: number; filled: boolean }>;
  usageView: ConstraintUsage | null;
  mrvScan: MRVScanItem[];
  mrvSwap: SwapState | null;
  history: SolverSnapshot[];
  viewIndex: number | null;
  stepCount: number;
  mrvIndex: number;
  metrics: SolverMetrics;
  stepsHistory: number[];
  nodesHistory: number[];
  backtracksHistory: number[];

  // Visualization state
  speed: number;
  logs: string[];
  logBoards: boolean;
  elapsedMs: number;
  mrvScanPos: number;

  // Additional state
  sampleKey: string;
  validation: { issues: ValidationIssue[]; conflictSet: Set<string> };
  samples: Array<{ key: string; name: string; rows: string[] }>;

  // Actions
  setSpeed: (speed: number) => void;
  setLogBoards: (enabled: boolean) => void;
  addLog: (message: string | string[]) => void;
  clearLogs: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  startMrvScanAnimation: (length: number) => void;
  stopMrvScanAnimation: () => void;
  initializePuzzle: (puzzle: Board) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  stepOnce: () => void;
  viewSnapshot: (index: number) => void;
  viewLive: () => void;

  // Enhanced actions
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onStep: () => void;
  onViewSnapshot: (index: number) => void;
  onViewLive: () => void;
  loadSample: (key: string) => void;
  onPaste: () => void;
}

// Component Props interfaces
export interface ControlsCardProps {
  controller: SudokuController;
  showAdvanced: boolean;
  setShowAdvanced: (value: boolean) => void;
  autoScrollMRV: boolean;
  setAutoScrollMRV: (value: boolean) => void;
  showCandidateCounts: boolean;
  setShowCandidateCounts: (value: boolean) => void;
  showCandidateDigits: boolean;
  setShowCandidateDigits: (value: boolean) => void;
  viewMode: string;
}

export interface MetricItemProps {
  label: string;
  value: number;
  history: number[];
  color: string;
}

export interface NarrativeMetricsProps {
  controller: SudokuController;
}

export interface CopyLogButtonProps {
  controller: SudokuController;
}

/**
 * Type guards and validation functions
 * Provide runtime type checking for better error handling and type safety
 */

/**
 * Type guard to check if a value is a valid Sudoku digit (1-9)
 * @param value - Value to check
 * @returns True if value is a digit between 1 and 9
 * @example
 * ```typescript
 * if (isDigit(userInput)) {
 *   // Safe to use as Digit type
 *   const calculation = userInput * 2;
 * }
 * ```
 */
export const isDigit = (value: unknown): value is Digit => {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 9;
};

/**
 * Type guard to check if a string is a valid digit character ('1'-'9')
 * @param value - String to check
 * @returns True if string represents a valid digit
 */
export const isDigitChar = (value: string): value is DigitChar => {
  return value.length === 1 && /^[1-9]$/.test(value);
};

/**
 * Type guard to check if a string represents an empty cell ('.')
 * @param value - String to check
 * @returns True if string is the empty cell marker
 */
export const isEmptyCell = (value: string): value is EmptyCell => {
  return value === '.';
};

/**
 * Type guard to check if a string is a valid cell value (digit or empty)
 * @param value - String to check
 * @returns True if string is either a digit or empty cell marker
 */
export const isValidCell = (value: string): value is ValidCell => {
  return isEmptyCell(value) || isDigitChar(value);
};

/**
 * Validates if coordinates represent a valid position on the board
 * @param r - Row index
 * @param c - Column index
 * @returns True if position is within board bounds (0-8, 0-8)
 */
export const isValidPosition = (r: number, c: number): boolean => {
  return Number.isInteger(r) && r >= 0 && r <= 8 && Number.isInteger(c) && c >= 0 && c <= 8;
};

/**
 * Cell conversion and utility functions
 * Provide safe conversions between different cell representations
 */

/**
 * Converts a Cell to string representation (no-op since Cell is already string)
 * @param cell - Cell value to convert
 * @returns String representation of the cell
 */
export const cellToString = (cell: Cell): string => {
  return cell; // Cell is already a string
};

/**
 * Safely converts a string to a Cell type with validation
 * @param value - String to convert
 * @returns Cell if valid, null if invalid
 * @example
 * ```typescript
 * const cell = stringToCell(userInput);
 * if (cell !== null) {
 *   // Safe to use as Cell
 *   board[r][c] = cell;
 * }
 * ```
 */
export const stringToCell = (value: string): Cell | null => {
  if (isValidCell(value)) {
    return value; // Return the string as-is since Cell is string-based
  }
  return null;
};

/**
 * Converts a digit character to its numeric value
 * @param char - Digit character ('1'-'9')
 * @returns Numeric digit (1-9)
 */
export const digitCharToNumber = (char: DigitChar): Digit => {
  return parseInt(char, 10) as Digit;
};

/**
 * Converts a numeric digit to its character representation
 * @param digit - Numeric digit (1-9)
 * @returns Digit character ('1'-'9')
 */
export const digitToChar = (digit: Digit): DigitChar => {
  return digit.toString() as DigitChar;
};

/**
 * Board validation utilities
 * Provide runtime validation for board structures
 */

/**
 * Type guard to validate if an array represents a valid Sudoku row
 * @param row - Array to validate
 * @returns True if array is a valid 9-cell row
 */
export const isValidRow = (row: unknown): row is Cell[] => {
  return Array.isArray(row) &&
         row.length === SUDOKU_SIZE &&
         row.every((cell) => typeof cell === 'string' && isValidCell(cell));
};

/**
 * Type guard to validate if a 2D array represents a valid Sudoku board
 * @param board - Array to validate
 * @returns True if array is a valid 9x9 board
 * @example
 * ```typescript
 * if (isValidBoard(userInput)) {
 *   // Safe to use board manipulation functions
 *   const solution = solveSudoku(userInput);
 * }
 * ```
 */
export const isValidBoard = (board: unknown): board is Board => {
  return Array.isArray(board) &&
         board.length === SUDOKU_SIZE &&
         board.every(isValidRow);
};