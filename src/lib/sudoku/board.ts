/**
 * @fileoverview Board Utilities and Constraint Management - Core Sudoku Operations
 *
 * Essential utilities for Sudoku board manipulation, constraint checking, and
 * state management. Provides optimized functions for the MRV solver algorithm
 * with focus on performance-critical operations.
 *
 * @module lib/sudoku/board
 * @version 1.0.0
 * @since Phase-2-Architecture-Finalization
 *
 * @architecture
 * - Constraint-based validation using boolean lookup tables
 * - O(1) constraint checking for optimal solver performance
 * - Pure functions with no side effects for predictable behavior
 * - Optimized box calculation using integer arithmetic
 *
 * @performance_notes
 * - `canPlace`: O(1) constraint checking using pre-built usage tables
 * - `boxId`: O(1) 3x3 box identification using integer division
 * - `buildUsage`: O(81) initial constraint table construction
 * - `cloneBoard`: O(81) deep copy for immutable operations
 *
 * @usage
 * ```typescript
 * import { buildUsage, canPlace, boxId, cloneBoard } from './lib/sudoku/board';
 *
 * // Initialize constraint tracking
 * const { rows, cols, boxes } = buildUsage(board);
 *
 * // Check if digit can be placed
 * if (canPlace(rows, cols, boxes, 3, 4, 7)) {
 *   // Safe to place digit 7 at position (3, 4)
 * }
 *
 * // Get 3x3 box identifier
 * const box = boxId(7, 8); // Returns 8 (bottom-right box)
 * ```
 */

import type { Board, ConstraintUsage } from '../../types/sudoku';

/**
 * Calculates the 3x3 box identifier for a given cell position
 *
 * Maps any cell coordinate (r, c) to its corresponding 3x3 box number (0-8).
 * Uses optimized integer arithmetic for O(1) performance.
 *
 * @param r - Row index (0-8)
 * @param c - Column index (0-8)
 * @returns Box identifier (0-8) where boxes are numbered left-to-right, top-to-bottom
 *
 * @box_layout
 * ```
 * 0 | 1 | 2
 * --+---+--
 * 3 | 4 | 5
 * --+---+--
 * 6 | 7 | 8
 * ```
 *
 * @example
 * ```typescript
 * boxId(0, 0); // 0 (top-left box)
 * boxId(0, 5); // 1 (top-middle box)
 * boxId(4, 4); // 4 (center box)
 * boxId(8, 8); // 8 (bottom-right box)
 * ```
 */
export const boxId = (r: number, c: number) => Math.floor(r / 3) * 3 + Math.floor(c / 3);

/**
 * Checks if a character represents a valid Sudoku digit
 *
 * Fast character validation using ASCII comparison for optimal performance
 * in constraint checking loops.
 *
 * @param ch - Character to validate
 * @returns True if character is '1' through '9'
 *
 * @example
 * ```typescript
 * isDigit('5');  // true
 * isDigit('.');  // false
 * isDigit('0');  // false
 * isDigit('a');  // false
 * ```
 */
export const isDigit = (ch: string) => ch >= '1' && ch <= '9';

/**
 * Builds constraint usage tables for efficient Sudoku validation
 *
 * Analyzes the current board state to create boolean lookup tables for
 * O(1) constraint checking. This is a fundamental optimization for the
 * MRV solver algorithm.
 *
 * @param board - Current Sudoku board state
 * @returns ConstraintUsage object with row, column, and box usage tables
 *
 * @data_structure
 * Returns three 9x10 boolean arrays (index 0 unused, 1-9 for digits):
 * - `rows[r][d]`: True if digit d is used in row r
 * - `cols[c][d]`: True if digit d is used in column c
 * - `boxes[b][d]`: True if digit d is used in box b
 *
 * @performance
 * - Time Complexity: O(81) - scans entire board once
 * - Space Complexity: O(270) - three 9x10 boolean arrays
 * - Called once per solving session, then maintained incrementally
 *
 * @example
 * ```typescript
 * const board = [
 *   ['5', '3', '.', '.', '7', '.', '.', '.', '.'],
 *   // ... more rows
 * ];
 *
 * const { rows, cols, boxes } = buildUsage(board);
 *
 * // Check if digit 5 is used in row 0
 * console.log(rows[0][5]); // true
 *
 * // Check if digit 1 is used in column 0
 * console.log(cols[0][1]); // false (assuming no 1 in first column)
 * ```
 */
export function buildUsage(board: Board): ConstraintUsage {
  const rows = Array.from({ length: 9 }, () => Array(10).fill(false));
  const cols = Array.from({ length: 9 }, () => Array(10).fill(false));
  const boxes = Array.from({ length: 9 }, () => Array(10).fill(false));

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const ch = board[r][c];
      if (isDigit(ch)) {
        const d = ch.charCodeAt(0) - 48; // '1'..'9' -> 1..9
        rows[r][d] = cols[c][d] = boxes[boxId(r, c)][d] = true;
      }
    }
  }
  return { rows, cols, boxes };
}

/**
 * Checks if a digit can be legally placed at a specific position
 *
 * Performs O(1) constraint validation using pre-built usage tables.
 * This is the most performance-critical function in the solver, called
 * thousands of times during MRV analysis and candidate generation.
 *
 * @param rows - Row usage table (rows[r][d] = true if digit d used in row r)
 * @param cols - Column usage table (cols[c][d] = true if digit d used in column c)
 * @param boxes - Box usage table (boxes[b][d] = true if digit d used in box b)
 * @param r - Target row (0-8)
 * @param c - Target column (0-8)
 * @param d - Digit to place (1-9)
 * @returns True if digit can be placed without violating Sudoku rules
 *
 * @sudoku_constraints
 * A digit can be placed if and only if:
 * 1. It's not already used in the same row
 * 2. It's not already used in the same column
 * 3. It's not already used in the same 3x3 box
 *
 * @performance
 * - Time Complexity: O(1) - three boolean array lookups
 * - Space Complexity: O(1) - no additional memory allocation
 * - Called extensively during MRV scanning and candidate generation
 *
 * @example
 * ```typescript
 * const { rows, cols, boxes } = buildUsage(board);
 *
 * if (canPlace(rows, cols, boxes, 3, 4, 7)) {
 *   // Digit 7 can be safely placed at position (3, 4)
 *   board[3][4] = '7';
 *   // Update usage tables:
 *   rows[3][7] = cols[4][7] = boxes[boxId(3,4)][7] = true;
 * }
 * ```
 */
export const canPlace = (
  rows: boolean[][],
  cols: boolean[][],
  boxes: boolean[][],
  r: number,
  c: number,
  d: number
) => !rows[r][d] && !cols[c][d] && !boxes[boxId(r, c)][d];

/**
 * Creates a deep copy of a Sudoku board
 *
 * Performs a deep copy to ensure immutability for solver state management.
 * Essential for creating working copies without modifying the original board.
 *
 * @param board - Source board to clone
 * @returns New board with identical content but independent arrays
 *
 * @immutability
 * Creates a complete deep copy where:
 * - The outer array is new (board.map creates new array)
 * - Each row array is new (row.slice creates new arrays)
 * - String contents are immutable by nature
 *
 * @performance
 * - Time Complexity: O(81) - visits each cell once
 * - Space Complexity: O(81) - creates new 9x9 array structure
 *
 * @example
 * ```typescript
 * const original = [['5', '3', '.'], ...];
 * const copy = cloneBoard(original);
 *
 * // Modifications to copy don't affect original
 * copy[0][0] = '1';
 * console.log(original[0][0]); // Still '5'
 * ```
 */
export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

/**
 * Converts a numeric digit to its string representation
 *
 * Simple conversion utility for consistent digit representation.
 * Used when placing digits during the solving process.
 *
 * @param d - Numeric digit (1-9)
 * @returns String representation of the digit
 *
 * @example
 * ```typescript
 * toChar(5); // '5'
 * toChar(9); // '9'
 * ```
 */
export const toChar = (d: number) => String(d);

/**
 * Converts a digit character to its numeric value
 *
 * Efficient character-to-number conversion using ASCII arithmetic.
 * Used for processing board characters during constraint analysis.
 *
 * @param ch - Digit character ('1'-'9')
 * @returns Numeric value (1-9)
 *
 * @performance
 * Uses ASCII arithmetic (charCodeAt(0) - 48) for optimal performance
 * instead of parseInt or Number conversion.
 *
 * @example
 * ```typescript
 * fromChar('5'); // 5
 * fromChar('9'); // 9
 * ```
 */
export const fromChar = (ch: string) => ch.charCodeAt(0) - 48;