/**
 * @fileoverview Sudoku Module Exports - Unified Sudoku Subsystem Interface
 *
 * Central export module for the Sudoku solver subsystem, providing organized
 * access to all core Sudoku functionality including board utilities, MRV solver,
 * and validation systems. Serves as the primary entry point for Sudoku operations.
 *
 * @module lib/sudoku/index
 * @version 1.0.0
 * @since Phase-2-Architecture-Finalization
 *
 * @architecture
 * - **Organized Exports**: Functions grouped by functionality (board, solver, validation)
 * - **Type Re-exports**: Convenient access to TypeScript types from central location
 * - **Clean Interface**: Single import point for all Sudoku operations
 * - **Namespace Organization**: Clear separation of concerns in export groups
 *
 * @usage_patterns
 * ```typescript
 * // Import everything from unified interface
 * import { solveSudokuMRV, buildUsage, canPlace, validateBoard } from './lib/sudoku';
 *
 * // Or import specific categories
 * import { boxId, isDigit, cloneBoard } from './lib/sudoku'; // Board utilities
 * import { solveSudokuMRV } from './lib/sudoku';            // Solver
 * import { validateBoard } from './lib/sudoku';             // Validation
 *
 * // Import types alongside functions
 * import { Board, SolverStep, ValidationIssue } from './lib/sudoku';
 * ```
 *
 * @module_organization
 * This module exports from three main subsystems:
 * 1. **Board Utilities** (`./board`): Core board manipulation and constraint checking
 * 2. **MRV Solver** (`./solver`): Advanced backtracking algorithm with visualization
 * 3. **Validation System** (`./validation`): Comprehensive error detection and conflict reporting
 *
 * @performance_considerations
 * - All exports are function references (no re-wrapping overhead)
 * - Type exports are compile-time only (zero runtime cost)
 * - Tree-shaking friendly: unused exports are eliminated in production builds
 * - Direct re-exports maintain original function performance characteristics
 */

/**
 * Board utilities for Sudoku manipulation and constraint management
 *
 * Core functions for board state management, constraint checking, and utility operations.
 * These are the fundamental building blocks used by the solver and validation systems.
 *
 * @functions
 * - `boxId(r, c)`: Calculate 3x3 box identifier for position
 * - `isDigit(ch)`: Fast character validation for digits 1-9
 * - `buildUsage(board)`: Build constraint usage tables for O(1) checking
 * - `canPlace(rows, cols, boxes, r, c, d)`: Check if digit can be placed legally
 * - `cloneBoard(board)`: Create deep copy for immutable operations
 * - `toChar(d)`: Convert numeric digit to string representation
 * - `fromChar(ch)`: Convert character digit to numeric value
 */
export { boxId, isDigit, buildUsage, canPlace, cloneBoard, toChar, fromChar } from './board';

/**
 * Advanced MRV (Minimum Remaining Values) Sudoku solver
 *
 * Generator-based solver implementing the MRV heuristic with comprehensive
 * visualization support for step-by-step solving process.
 *
 * @functions
 * - `solveSudokuMRV(board)`: Main solver function with step-by-step generation
 */
export { solveSudokuMRV } from './solver';

/**
 * Sudoku validation system with conflict detection
 *
 * Comprehensive validation functions optimized for real-time feedback
 * and UI conflict highlighting during the solving process.
 *
 * @functions
 * - `validateBoard(board)`: Complete validation with all checks
 * - `validateBoardShape(board)`: Structural validation (9x9 dimensions)
 * - `validateBoardChars(board)`: Character content validation
 * - `validateDuplicates(board)`: Sudoku rule compliance with conflict detection
 */
export { validateBoard, validateBoardShape, validateBoardChars, validateDuplicates } from './validation';

/**
 * TypeScript type definitions for Sudoku operations
 *
 * Re-exported types from the central type system for convenient access
 * alongside the corresponding functions. Enables type-safe Sudoku operations.
 *
 * @types
 * - `Board`: 9x9 string array representing Sudoku board
 * - `Cell`: Individual cell type (string)
 * - `SolverStep`: Union type for all solver step events
 * - `SolverSnapshot`: Complete state snapshot for visualization
 * - `ValidationIssue`: Error description for validation problems
 * - `MRVScanItem`: MRV algorithm analysis data
 * - `SolverMetrics`: Performance metrics and statistics
 * - `ConstraintUsage`: Boolean usage tables for rows/columns/boxes
 */
export type { Board, Cell, SolverStep, SolverSnapshot, ValidationIssue, MRVScanItem, SolverMetrics, ConstraintUsage } from '../../types/sudoku';