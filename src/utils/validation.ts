/**
 * @fileoverview Input Validation Utilities - Comprehensive Board Validation System
 *
 * Provides robust validation for Sudoku board input with detailed error reporting,
 * structural validation, rule checking, and solvability analysis. Ensures data
 * integrity and provides meaningful feedback for invalid input.
 *
 * @module utils/validation
 * @version 1.0.0
 * @since Phase-2-Architecture-Finalization
 *
 * @architecture
 * - Multi-layered validation approach (structure → rules → solvability)
 * - Comprehensive error and warning reporting
 * - Type-safe validation with unknown input handling
 * - Safe parsing and board creation utilities
 *
 * @usage
 * ```typescript
 * import { validateBoard, createBoardFromString } from './utils/validation';
 *
 * // Validate existing board
 * const result = validateBoard(userBoard);
 * if (result.isValid) {
 *   // Safe to use board
 * } else {
 *   console.error(result.errors);
 * }
 *
 * // Parse string input safely
 * const { board, validation } = createBoardFromString(textInput);
 * if (board) {
 *   // Use validated board
 * }
 * ```
 *
 * @validation_layers
 * 1. Structure validation: Array dimensions, cell types, character validity
 * 2. Sudoku rules: No duplicates in rows, columns, and 3x3 boxes
 * 3. Solvability: Clue count analysis, empty cell possibility checking
 */

import type { Board } from '../types/sudoku';

/**
 * Validation result interface containing validity status and detailed feedback
 *
 * Provides comprehensive validation results with separate error and warning arrays.
 * Errors indicate invalid input that prevents solving, while warnings indicate
 * potential issues or suboptimal conditions.
 *
 * @interface
 */
export interface ValidationResult {
  /** Whether the input passes all validation checks */
  isValid: boolean;
  /** Critical errors that prevent board usage */
  errors: string[];
  /** Non-critical warnings about potential issues */
  warnings: string[];
}

/**
 * Validates the structural integrity of board input
 *
 * Performs comprehensive validation of board structure including type checking,
 * dimension validation, and character format verification. This is the first
 * layer of validation that ensures the input can be safely processed.
 *
 * @param input - Unknown input to validate (typically from user input)
 * @returns ValidationResult with detailed error information
 *
 * @validation_checks
 * - Null/undefined input detection
 * - Array type validation for board and rows
 * - 9x9 dimension verification
 * - Cell type and format validation
 * - Character validity (1-9 and '.' only)
 *
 * @example
 * ```typescript
 * const result = validateBoardStructure(userInput);
 * if (!result.isValid) {
 *   console.error('Structure errors:', result.errors);
 *   return;
 * }
 * // Safe to cast to Board type
 * const board = input as Board;
 * ```
 */
export function validateBoardStructure(input: unknown): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Check if input exists
  if (input === null || input === undefined) {
    result.errors.push('Board is null or undefined');
    result.isValid = false;
    return result;
  }

  // Check if input is an array
  if (!Array.isArray(input)) {
    result.errors.push('Board must be an array');
    result.isValid = false;
    return result;
  }

  // Check board dimensions
  if (input.length !== 9) {
    result.errors.push(`Board must have 9 rows, found ${input.length}`);
    result.isValid = false;
    return result;
  }

  // Check each row
  for (let r = 0; r < 9; r++) {
    const row = input[r];

    if (!Array.isArray(row)) {
      result.errors.push(`Row ${r + 1} must be an array, found ${typeof row}`);
      result.isValid = false;
      continue;
    }

    if (row.length !== 9) {
      result.errors.push(`Row ${r + 1} must have 9 cells, found ${row.length}`);
      result.isValid = false;
      continue;
    }

    // Check each cell
    for (let c = 0; c < 9; c++) {
      const cell = row[c];

      if (typeof cell !== 'string') {
        result.errors.push(`Cell (${r + 1}, ${c + 1}) must be a string, found ${typeof cell}`);
        result.isValid = false;
        continue;
      }

      if (cell.length !== 1) {
        result.errors.push(`Cell (${r + 1}, ${c + 1}) must be a single character, found "${cell}" (length ${cell.length})`);
        result.isValid = false;
        continue;
      }

      if (!/^[1-9.]$/.test(cell)) {
        result.errors.push(`Cell (${r + 1}, ${c + 1}) must be a digit 1-9 or '.', found "${cell}"`);
        result.isValid = false;
        continue;
      }
    }
  }

  return result;
}

/**
 * Validates Sudoku rule compliance (no duplicates in rows, columns, boxes)
 *
 * Checks the fundamental Sudoku constraint that no digit can appear twice
 * in the same row, column, or 3x3 box. This assumes the board structure
 * has already been validated.
 *
 * @param board - Structurally valid Sudoku board
 * @returns ValidationResult with rule violation details
 *
 * @sudoku_rules
 * - No duplicate digits in any row (1-9)
 * - No duplicate digits in any column (1-9)
 * - No duplicate digits in any 3x3 box (1-9)
 * - Empty cells ('.') are ignored in duplicate checking
 *
 * @example
 * ```typescript
 * const result = validateSudokuRules(board);
 * if (!result.isValid) {
 *   result.errors.forEach(error => console.error(error));
 * }
 * ```
 */
export function validateSudokuRules(board: Board): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Check rows
  for (let r = 0; r < 9; r++) {
    const seen = new Set<string>();
    for (let c = 0; c < 9; c++) {
      const cell = board[r][c];
      if (cell !== '.' && seen.has(cell)) {
        result.errors.push(`Duplicate ${cell} in row ${r + 1}`);
        result.isValid = false;
      }
      if (cell !== '.') seen.add(cell);
    }
  }

  // Check columns
  for (let c = 0; c < 9; c++) {
    const seen = new Set<string>();
    for (let r = 0; r < 9; r++) {
      const cell = board[r][c];
      if (cell !== '.' && seen.has(cell)) {
        result.errors.push(`Duplicate ${cell} in column ${c + 1}`);
        result.isValid = false;
      }
      if (cell !== '.') seen.add(cell);
    }
  }

  // Check 3x3 boxes
  for (let boxR = 0; boxR < 3; boxR++) {
    for (let boxC = 0; boxC < 3; boxC++) {
      const seen = new Set<string>();
      for (let r = boxR * 3; r < boxR * 3 + 3; r++) {
        for (let c = boxC * 3; c < boxC * 3 + 3; c++) {
          const cell = board[r][c];
          if (cell !== '.' && seen.has(cell)) {
            result.errors.push(`Duplicate ${cell} in box (${boxR + 1}, ${boxC + 1})`);
            result.isValid = false;
          }
          if (cell !== '.') seen.add(cell);
        }
      }
    }
  }

  return result;
}

/**
 * Validates board solvability and provides puzzle quality analysis
 *
 * Performs heuristic analysis to determine if the puzzle is likely solvable
 * and provides warnings about puzzle quality based on clue count and
 * constraint analysis.
 *
 * @param board - Rule-compliant Sudoku board
 * @returns ValidationResult with solvability analysis and quality warnings
 *
 * @solvability_analysis
 * - Clue count analysis (minimum 17 clues for unique solution)
 * - Maximum clue warnings (60+ clues indicate mostly solved puzzle)
 * - Empty cell constraint checking (cells with no possible values)
 * - Forward checking for immediate unsolvability detection
 *
 * @example
 * ```typescript
 * const result = validateSolvability(board);
 * if (!result.isValid) {
 *   console.error('Unsolvable:', result.errors);
 * }
 * if (result.warnings.length > 0) {
 *   console.warn('Quality issues:', result.warnings);
 * }
 * ```
 */
export function validateSolvability(board: Board): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Count filled cells
  let filledCount = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== '.') filledCount++;
    }
  }

  // Warning if too few clues
  if (filledCount < 17) {
    result.warnings.push(`Only ${filledCount} clues provided. Sudoku typically needs at least 17 clues to have a unique solution.`);
  }

  // Warning if too many clues
  if (filledCount > 60) {
    result.warnings.push(`${filledCount} clues provided. This puzzle is mostly solved already.`);
  }

  // Check if any cell has no possible values
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === '.') {
        const possibleValues = getPossibleValues(board, r, c);
        if (possibleValues.length === 0) {
          result.errors.push(`Cell (${r + 1}, ${c + 1}) has no possible values. Puzzle is unsolvable.`);
          result.isValid = false;
        }
      }
    }
  }

  return result;
}

/**
 * Calculates possible values for an empty cell based on Sudoku constraints
 *
 * Analyzes row, column, and box constraints to determine which digits
 * can be legally placed in the specified cell. Used for solvability analysis
 * and constraint checking.
 *
 * @param board - The current board state
 * @param row - Row index (0-8)
 * @param col - Column index (0-8)
 * @returns Array of possible digit strings for the cell
 *
 * @algorithm
 * 1. Collect all digits used in the same row
 * 2. Collect all digits used in the same column
 * 3. Collect all digits used in the same 3x3 box
 * 4. Return digits 1-9 that are not in the used set
 *
 * @example
 * ```typescript
 * const possible = getPossibleValues(board, 0, 0);
 * if (possible.length === 0) {
 *   console.log('Cell (1,1) has no valid moves - puzzle may be unsolvable');
 * }
 * ```
 */
function getPossibleValues(board: Board, row: number, col: number): string[] {
  if (board[row][col] !== '.') return [];

  const used = new Set<string>();

  // Check row
  for (let c = 0; c < 9; c++) {
    if (board[row][c] !== '.') used.add(board[row][c]);
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    if (board[r][col] !== '.') used.add(board[r][col]);
  }

  // Check 3x3 box
  const boxR = Math.floor(row / 3) * 3;
  const boxC = Math.floor(col / 3) * 3;
  for (let r = boxR; r < boxR + 3; r++) {
    for (let c = boxC; c < boxC + 3; c++) {
      if (board[r][c] !== '.') used.add(board[r][c]);
    }
  }

  const possible: string[] = [];
  for (let i = 1; i <= 9; i++) {
    if (!used.has(String(i))) {
      possible.push(String(i));
    }
  }

  return possible;
}

/**
 * Comprehensive board validation combining all validation layers
 *
 * Performs complete validation by sequentially applying structure validation,
 * Sudoku rules checking, and solvability analysis. Stops at first critical
 * failure but combines all warnings from applicable layers.
 *
 * @param board - Unknown input to validate completely
 * @returns Combined ValidationResult from all applicable validation layers
 *
 * @validation_sequence
 * 1. Structure validation (must pass to continue)
 * 2. Sudoku rules validation
 * 3. Solvability analysis
 * 4. Result combination and aggregation
 *
 * @example
 * ```typescript
 * const result = validateBoard(userInput);
 * if (result.isValid) {
 *   // Safe to use as Sudoku board
 *   const board = userInput as Board;
 *   startSolver(board);
 * } else {
 *   displayErrors(result.errors);
 *   displayWarnings(result.warnings);
 * }
 * ```
 */
export function validateBoard(board: unknown): ValidationResult {
  // First check structure
  const structureResult = validateBoardStructure(board);
  if (!structureResult.isValid) {
    return structureResult;
  }

  const validBoard = board as Board;

  // Then check Sudoku rules
  const rulesResult = validateSudokuRules(validBoard);

  // Then check solvability
  const solvabilityResult = validateSolvability(validBoard);

  // Combine results
  return {
    isValid: structureResult.isValid && rulesResult.isValid && solvabilityResult.isValid,
    errors: [
      ...structureResult.errors,
      ...rulesResult.errors,
      ...solvabilityResult.errors
    ],
    warnings: [
      ...structureResult.warnings,
      ...rulesResult.warnings,
      ...solvabilityResult.warnings
    ]
  };
}

/**
 * Safely creates a Sudoku board from string input with comprehensive validation
 *
 * Parses multi-line string input into a Board array while providing detailed
 * error reporting and validation. Handles various string formats and provides
 * safe error recovery.
 *
 * @param input - Multi-line string representing a Sudoku puzzle
 * @returns Object containing the parsed board (if valid) and validation results
 *
 * @input_format
 * - 9 lines of text, each containing exactly 9 characters
 * - Use digits 1-9 for filled cells, '.' for empty cells
 * - Supports various line ending formats (\n, \r\n, \r)
 * - Leading/trailing whitespace is automatically trimmed
 *
 * @example
 * ```typescript
 * const puzzleText = `
 * 53..7....
 * 6..195...
 * .98....6.
 * 8...6...3
 * 4..8.3..1
 * 7...2...6
 * .6....28.
 * ...419..5
 * ....8..79
 * `;
 *
 * const { board, validation } = createBoardFromString(puzzleText);
 * if (board) {
 *   console.log('Valid puzzle loaded');
 *   solvePuzzle(board);
 * } else {
 *   console.error('Parsing failed:', validation.errors);
 * }
 * ```
 */
export function createBoardFromString(input: string): { board: Board | null; validation: ValidationResult } {
  try {
    const lines = input.trim().split(/\n|\r\n?/).map(s => s.trim());

    if (lines.length !== 9) {
      return {
        board: null,
        validation: {
          isValid: false,
          errors: [`Expected 9 lines, got ${lines.length}`],
          warnings: []
        }
      };
    }

    const board = lines.map(line => {
      if (line.length !== 9) {
        throw new Error(`Line "${line}" must have 9 characters, got ${line.length}`);
      }
      return line.split('');
    });

    const validation = validateBoard(board);
    return { board: validation.isValid ? board : null, validation };
  } catch (error) {
    return {
      board: null,
      validation: {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown parsing error'],
        warnings: []
      }
    };
  }
}