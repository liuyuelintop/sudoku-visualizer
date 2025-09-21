/**
 * @fileoverview Legacy Sudoku Validation - Solver-Specific Validation System
 *
 * Provides legacy validation functions specifically designed for the Sudoku solver
 * subsystem. Complements the main validation utilities with solver-specific error
 * reporting and conflict detection optimized for UI feedback.
 *
 * @module lib/sudoku/validation
 * @version 1.0.0
 * @since Phase-2-Architecture-Finalization
 *
 * @architecture
 * - ValidationIssue-based error reporting for UI consumption
 * - Conflict set generation for visual feedback highlighting
 * - Layered validation approach (shape → characters → duplicates)
 * - Optimized for real-time validation during solving process
 *
 * @relationship_to_main_validation
 * This module complements `src/utils/validation.ts`:
 * - Main validation: Comprehensive input validation with detailed errors
 * - Legacy validation: Fast solver-specific validation with UI conflict sets
 * - Both use different error formats for different use cases
 *
 * @usage
 * ```typescript
 * import { validateBoard, validateDuplicates } from './lib/sudoku/validation';
 *
 * // Complete validation with conflict highlighting
 * const { issues, conflictSet } = validateBoard(board);
 * if (issues.length > 0) {
 *   highlightConflicts(conflictSet);
 *   showValidationErrors(issues);
 * }
 *
 * // Real-time duplicate checking during solving
 * const { conflictSet } = validateDuplicates(currentBoard);
 * updateConflictHighlights(conflictSet);
 * ```
 */

import type { Board, ValidationIssue } from '../../types/sudoku';
import { isDigit } from './board';

/**
 * Validates the structural shape and dimensions of a Sudoku board
 *
 * Performs fast structural validation to ensure the board meets basic
 * 9x9 dimensional requirements. This is the first validation layer.
 *
 * @param board - Board to validate for structural integrity
 * @returns Array of ValidationIssue objects describing shape problems
 *
 * @validation_checks
 * - Board is an array with exactly 9 rows
 * - Each row is an array with exactly 9 cells
 * - No validation of cell contents (handled by other functions)
 *
 * @performance
 * - Time Complexity: O(9) - checks each row length
 * - Space Complexity: O(k) where k is number of shape errors
 * - Fast-fail on board-level shape errors
 *
 * @example
 * ```typescript
 * const issues = validateBoardShape(board);
 * if (issues.length > 0) {
 *   console.error('Board shape errors:', issues);
 *   // [{ type: 'shape', message: 'Row 3 must have 9 cells' }]
 * }
 * ```
 */
export function validateBoardShape(board: Board): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!Array.isArray(board) || board.length !== 9) {
    issues.push({ type: 'shape', message: 'Board must have 9 rows' });
    return issues;
  }

  for (let r = 0; r < 9; r++) {
    if (!Array.isArray(board[r]) || board[r].length !== 9) {
      issues.push({ type: 'shape', message: `Row ${r + 1} must have 9 cells` });
    }
  }

  return issues;
}

/**
 * Validates character content of all cells in the board
 *
 * Checks that every cell contains either a valid digit ('1'-'9') or an
 * empty cell marker ('.'). This is the second validation layer.
 *
 * @param board - Board to validate for character validity
 * @returns Array of ValidationIssue objects describing character problems
 *
 * @validation_rules
 * - Cells must contain only: '1', '2', '3', '4', '5', '6', '7', '8', '9', or '.'
 * - Invalid characters include: '0', letters, symbols, empty strings
 * - Uses optimized isDigit function for performance
 *
 * @performance
 * - Time Complexity: O(81) - scans every cell once
 * - Space Complexity: O(k) where k is number of invalid characters
 * - Fast character validation using ASCII comparison
 *
 * @example
 * ```typescript
 * const issues = validateBoardChars(board);
 * if (issues.length > 0) {
 *   console.error('Character errors:', issues);
 *   // [{ type: 'char', message: 'Invalid char at (2,3)' }]
 * }
 * ```
 */
export function validateBoardChars(board: Board): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const ch = board[r][c];
      if (ch !== '.' && !isDigit(ch)) {
        issues.push({ type: 'char', message: `Invalid char at (${r + 1},${c + 1})` });
      }
    }
  }

  return issues;
}

/**
 * Validates Sudoku rules by detecting duplicate digits in rows, columns, and boxes
 *
 * Comprehensive duplicate detection that identifies all constraint violations
 * and builds a conflict set for UI highlighting. This is the core validation
 * function for rule compliance checking.
 *
 * @param board - Board to validate for Sudoku rule compliance
 * @returns Object containing ValidationIssue array and conflict set for highlighting
 *
 * @sudoku_constraints
 * Validates three fundamental Sudoku rules:
 * 1. **Row Constraint**: No digit appears twice in any row
 * 2. **Column Constraint**: No digit appears twice in any column
 * 3. **Box Constraint**: No digit appears twice in any 3x3 box
 *
 * @conflict_detection
 * - Uses Map structures for efficient duplicate detection
 * - Tracks all positions of each digit occurrence
 * - Builds conflict set with "r,c" string keys for UI highlighting
 * - Provides detailed position information for error reporting
 *
 * @performance
 * - Time Complexity: O(81) - single pass with efficient Map lookups
 * - Space Complexity: O(k) where k is number of conflicts
 * - Optimized box iteration using nested loops
 *
 * @return_structure
 * ```typescript
 * {
 *   issues: ValidationIssue[],     // Detailed error descriptions
 *   conflictSet: Set<string>       // Cell positions "r,c" for highlighting
 * }
 * ```
 *
 * @example
 * ```typescript
 * const { issues, conflictSet } = validateDuplicates(board);
 *
 * // Handle validation errors
 * issues.forEach(issue => {
 *   console.error(`${issue.type}: ${issue.message}`);
 *   // "row: Row 1 has duplicate 5"
 * });
 *
 * // Highlight conflicting cells in UI
 * conflictSet.forEach(pos => {
 *   const [r, c] = pos.split(',').map(Number);
 *   highlightCell(r, c, 'error');
 * });
 * ```
 */
export function validateDuplicates(board: Board): { issues: ValidationIssue[]; conflictSet: Set<string> } {
  const issues: ValidationIssue[] = [];
  const conflictSet = new Set<string>();

  // Check rows
  for (let r = 0; r < 9; r++) {
    const map = new Map<string, Array<{ r: number; c: number }>>();
    for (let c = 0; c < 9; c++) {
      const ch = board[r][c];
      if (isDigit(ch)) {
        const arr = map.get(ch) || [];
        arr.push({ r, c });
        map.set(ch, arr);
      }
    }
    for (const [ch, arr] of map) {
      if (arr.length > 1) {
        arr.forEach(p => conflictSet.add(`${p.r},${p.c}`));
        issues.push({
          type: 'row',
          digit: ch.charCodeAt(0) - 48,
          positions: arr,
          message: `Row ${r + 1} has duplicate ${ch}`
        });
      }
    }
  }

  // Check columns
  for (let c = 0; c < 9; c++) {
    const map = new Map<string, Array<{ r: number; c: number }>>();
    for (let r = 0; r < 9; r++) {
      const ch = board[r][c];
      if (isDigit(ch)) {
        const arr = map.get(ch) || [];
        arr.push({ r, c });
        map.set(ch, arr);
      }
    }
    for (const [ch, arr] of map) {
      if (arr.length > 1) {
        arr.forEach(p => conflictSet.add(`${p.r},${p.c}`));
        issues.push({
          type: 'col',
          digit: ch.charCodeAt(0) - 48,
          positions: arr,
          message: `Column ${c + 1} has duplicate ${ch}`
        });
      }
    }
  }

  // Check boxes
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const map = new Map<string, Array<{ r: number; c: number }>>();
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) {
          const ch = board[r][c];
          if (isDigit(ch)) {
            const arr = map.get(ch) || [];
            arr.push({ r, c });
            map.set(ch, arr);
          }
        }
      }
      for (const [ch, arr] of map) {
        if (arr.length > 1) {
          arr.forEach(p => conflictSet.add(`${p.r},${p.c}`));
          const bid = br * 3 + bc + 1;
          issues.push({
            type: 'box',
            digit: ch.charCodeAt(0) - 48,
            positions: arr,
            message: `Box ${bid} has duplicate ${ch}`
          });
        }
      }
    }
  }

  return { issues, conflictSet };
}

/**
 * Comprehensive board validation combining all validation layers
 *
 * Master validation function that applies all validation checks in sequence
 * and combines results into a unified response. Designed for complete
 * board validation before solver initialization or during UI feedback.
 *
 * @param board - Board to validate completely
 * @returns Combined validation results with all issues and conflicts
 *
 * @validation_sequence
 * Applies validation layers in order:
 * 1. **Shape Validation**: Ensures 9x9 structure
 * 2. **Character Validation**: Validates cell content format
 * 3. **Duplicate Validation**: Checks Sudoku rule compliance
 *
 * @aggregation_strategy
 * - Combines all ValidationIssue arrays into single comprehensive list
 * - Merges conflict sets from duplicate validation (only duplicates generate conflicts)
 * - Preserves error categorization (shape/char/row/col/box types)
 * - Maintains position information for UI highlighting
 *
 * @use_cases
 * - Pre-solver validation: Complete check before starting solve process
 * - Real-time feedback: Continuous validation during user input
 * - Error reporting: Comprehensive error list for user feedback
 * - Conflict highlighting: Visual feedback for constraint violations
 *
 * @example
 * ```typescript
 * const { issues, conflictSet } = validateBoard(board);
 *
 * // Check if board is valid for solving
 * if (issues.length === 0) {
 *   startSolver(board);
 * } else {
 *   displayValidationErrors(issues);
 *   highlightConflicts(conflictSet);
 * }
 *
 * // Categorize errors by type
 * const shapeErrors = issues.filter(i => i.type === 'shape');
 * const ruleErrors = issues.filter(i => ['row', 'col', 'box'].includes(i.type));
 * ```
 */
export function validateBoard(board: Board): { issues: ValidationIssue[]; conflictSet: Set<string> } {
  const shapeIssues = validateBoardShape(board);
  const charIssues = validateBoardChars(board);
  const { issues: duplicateIssues, conflictSet } = validateDuplicates(board);

  return {
    issues: [...shapeIssues, ...charIssues, ...duplicateIssues],
    conflictSet
  };
}