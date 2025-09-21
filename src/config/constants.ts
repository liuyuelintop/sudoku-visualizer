/**
 * @fileoverview Application Configuration Constants - Centralized Configuration System
 *
 * Comprehensive configuration management for the Sudoku visualizer application.
 * Centralizes all magic numbers, timing constants, and configuration values
 * previously scattered throughout the codebase for better maintainability.
 *
 * @module config/constants
 * @version 1.0.0
 * @since Phase-2-Architecture-Finalization
 *
 * @architecture
 * - Type-safe configuration objects with 'as const' assertions
 * - Organized by functional domains (UI, Animation, Performance, etc.)
 * - Centralized access through unified CONFIG object
 * - Environment-specific configuration support
 *
 * @usage
 * ```typescript
 * import { CONFIG, SUDOKU_CONFIG, ANIMATION_CONFIG } from './config/constants';
 *
 * // Direct access to specific configurations
 * const boardSize = SUDOKU_CONFIG.BOARD_SIZE;
 * const swapDuration = ANIMATION_CONFIG.SWAP_HIGHLIGHT_DURATION;
 *
 * // Or use unified configuration object
 * const cellSize = CONFIG.UI.CELL_SIZE;
 * const maxSpeed = CONFIG.UI.MAX_SPEED;
 * ```
 *
 * @performance
 * - All constants are compile-time evaluated
 * - 'as const' provides literal type inference
 * - Zero runtime overhead for configuration access
 */

/**
 * Core Sudoku game configuration constants
 *
 * Defines the fundamental rules and structure of standard Sudoku puzzles.
 * These values should remain constant across all puzzle instances.
 *
 * @constant
 * @readonly
 */
export const SUDOKU_CONFIG = {
  /** Standard Sudoku board dimensions (9x9) */
  BOARD_SIZE: 9,
  /** Size of each 3x3 sub-box within the board */
  BOX_SIZE: 3,
  /** Minimum valid digit value */
  MIN_DIGIT: 1,
  /** Maximum valid digit value */
  MAX_DIGIT: 9,
  /** Character representation for empty cells */
  EMPTY_CELL_CHAR: '.',
} as const;

/**
 * Animation timing configuration for visual feedback and transitions
 *
 * Controls the timing of various animations throughout the solver visualization.
 * All values are in milliseconds. Adjust these values to fine-tune the user
 * experience and visual feedback responsiveness.
 *
 * @constant
 * @readonly
 */
export const ANIMATION_CONFIG = {
  /** Duration for highlighting swapped elements in EmptiesArrayVisualizer (ms) */
  SWAP_HIGHLIGHT_DURATION: 400,

  /** Interval between MRV scan animation steps (ms) */
  MRV_SCAN_INTERVAL: 120,

  /** General CSS transition duration for smooth state changes (ms) */
  TRANSITION_DURATION: 300,

  /** Debounce delay for timeline navigation to prevent excessive updates (ms) */
  TIMELINE_DEBOUNCE: 100,
} as const;

/**
 * Performance optimization configuration
 *
 * Controls memory usage, rendering performance, and UI responsiveness.
 * These settings balance visualization completeness with application performance.
 *
 * @constant
 * @readonly
 */
export const PERFORMANCE_CONFIG = {
  /** Maximum solver steps to keep in history before triggering memory optimization */
  MAX_HISTORY_STEPS: 1000,

  /** Render throttling interval for high-frequency updates (~60fps) (ms) */
  RENDER_THROTTLE_MS: 16,

  /** Maximum time allowed per step execution to maintain UI responsiveness (ms) */
  STEP_TIMEOUT_MS: 5,
} as const;

/**
 * User interface layout and styling configuration
 *
 * Defines visual dimensions, spacing, and interaction parameters for UI components.
 * These values directly affect the visual appearance and user experience.
 *
 * @constant
 * @readonly
 */
export const UI_CONFIG = {
  /** Size of each Sudoku cell in the board grid (px) */
  CELL_SIZE: 40,
  /** Border width for visual separation (px) */
  BORDER_WIDTH: 1,

  /** Maximum height for the EmptiesPanel scrollable area (px, corresponds to max-h-96) */
  MAX_EMPTIES_HEIGHT: 384,

  /** Minimum animation speed (slower = higher ms value) */
  MIN_SPEED: 50,
  /** Maximum animation speed (faster = lower ms value) */
  MAX_SPEED: 300,
  /** Default animation speed for balanced user experience */
  DEFAULT_SPEED: 150,
} as const;

/**
 * Sudoku solving algorithm configuration
 *
 * Parameters that control the behavior of the MRV (Minimum Remaining Values)
 * backtracking algorithm and related heuristics.
 *
 * @constant
 * @readonly
 */
export const ALGORITHM_CONFIG = {
  /** Initial "best count" value for MRV heuristic (impossible high value) */
  INITIAL_BEST_COUNT: 10,

  /** Indicates a cell has no valid candidates (triggers backtracking) */
  NO_CANDIDATES_COUNT: 0,

  /** Number of rows in each 3x3 box (derived from SUDOKU_CONFIG) */
  BOX_ROWS: SUDOKU_CONFIG.BOX_SIZE,
  /** Number of columns in each 3x3 box (derived from SUDOKU_CONFIG) */
  BOX_COLS: SUDOKU_CONFIG.BOX_SIZE,
} as const;

/**
 * Input validation configuration and error messages
 *
 * Standardized error messages and validation parameters for consistent
 * user feedback across the application.
 *
 * @constant
 * @readonly
 */
export const VALIDATION_CONFIG = {
  /** Error message for duplicate digits in the same row */
  DUPLICATE_ROW_MSG: 'Duplicate digit in row',
  /** Error message for duplicate digits in the same column */
  DUPLICATE_COL_MSG: 'Duplicate digit in column',
  /** Error message for duplicate digits in the same 3x3 box */
  DUPLICATE_BOX_MSG: 'Duplicate digit in box',
  /** Error message for invalid characters in board input */
  INVALID_CHAR_MSG: 'Invalid character (must be 1-9 or .)',
  /** Error message for incorrect board dimensions */
  INVALID_SHAPE_MSG: 'Board must be 9x9',
} as const;

/**
 * Development and debugging configuration
 *
 * Controls development-time features, logging, and debug functionality.
 * These settings should be disabled in production builds.
 *
 * @constant
 * @readonly
 */
export const DEV_CONFIG = {
  /** Enable general console logging for debugging */
  ENABLE_CONSOLE_LOGS: true,
  /** Enable performance-specific logging (verbose) */
  ENABLE_PERFORMANCE_LOGS: false,

  /** Enable validation of solver steps during execution */
  ENABLE_STEP_VALIDATION: true,
  /** Enable memory usage tracking and reporting */
  ENABLE_MEMORY_TRACKING: false,
} as const;

/**
 * Unified configuration object providing centralized access to all application settings
 *
 * Combines all individual configuration objects into a single, type-safe interface.
 * Provides both direct access to individual configs and unified access through
 * this master configuration object.
 *
 * @constant
 * @readonly
 *
 * @example
 * ```typescript
 * // Direct access to specific configurations
 * import { SUDOKU_CONFIG, UI_CONFIG } from './config/constants';
 * const boardSize = SUDOKU_CONFIG.BOARD_SIZE;
 *
 * // Or use unified configuration object
 * import { CONFIG } from './config/constants';
 * const cellSize = CONFIG.UI.CELL_SIZE;
 * const maxSteps = CONFIG.PERFORMANCE.MAX_HISTORY_STEPS;
 * ```
 */
export const CONFIG = {
  /** Core Sudoku game rules and structure */
  SUDOKU: SUDOKU_CONFIG,
  /** Animation timing and visual feedback */
  ANIMATION: ANIMATION_CONFIG,
  /** Performance optimization settings */
  PERFORMANCE: PERFORMANCE_CONFIG,
  /** User interface layout and styling */
  UI: UI_CONFIG,
  /** Solving algorithm parameters */
  ALGORITHM: ALGORITHM_CONFIG,
  /** Input validation and error messages */
  VALIDATION: VALIDATION_CONFIG,
  /** Development and debugging features */
  DEV: DEV_CONFIG,
} as const;