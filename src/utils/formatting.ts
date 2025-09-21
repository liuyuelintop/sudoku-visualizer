/**
 * @fileoverview Display Formatting Utilities - Text and Time Presentation
 *
 * Provides utilities for formatting data for user display including time formatting,
 * log message creation, and board representation. Ensures consistent presentation
 * throughout the application user interface.
 *
 * @module utils/formatting
 * @version 1.0.0
 * @since Phase-2-Architecture-Finalization
 *
 * @architecture
 * - Pure functions with no side effects
 * - Consistent formatting patterns across components
 * - Localization-ready string formatting
 * - Performance-optimized for frequent updates
 *
 * @usage
 * ```typescript
 * import { formatElapsedTime, formatLogMessage, boardToLogLines } from './utils/formatting';
 *
 * // Time formatting for solver duration
 * const timeDisplay = formatElapsedTime(12345); // "12s" or "2:05"
 *
 * // Log message creation
 * const logEntry = formatLogMessage(42, 'selectCell', '(3,4)');
 *
 * // Board serialization for logging
 * const logLines = boardToLogLines(board);
 * ```
 */

/**
 * Formats elapsed time in milliseconds to human-readable string
 *
 * Converts milliseconds to a user-friendly time display format.
 * Uses seconds for short durations and minutes:seconds for longer ones.
 *
 * @param ms - Elapsed time in milliseconds
 * @returns Formatted time string (e.g., "42s", "2:05")
 *
 * @formatting_rules
 * - Less than 60 seconds: "XYs" format
 * - 60+ seconds: "M:SS" format with zero-padded seconds
 * - Always rounds down to whole seconds
 *
 * @example
 * ```typescript
 * formatElapsedTime(5000);   // "5s"
 * formatElapsedTime(65000);  // "1:05"
 * formatElapsedTime(125000); // "2:05"
 * formatElapsedTime(500);    // "0s"
 * ```
 */
export function formatElapsedTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${remainingSeconds}s`;
}

/**
 * Formats solver step events into structured log messages
 *
 * Creates consistent log message format for solver events with optional
 * detail information. Used throughout the solver visualization for
 * step-by-step logging.
 *
 * @param stepCount - Current step number in the solving process
 * @param event - Type of solver event (e.g., 'selectCell', 'place', 'backtrack')
 * @param details - Optional additional information for the event
 * @returns Formatted log message string
 *
 * @message_format
 * - Base format: "step N: eventType"
 * - With details: "step N: eventType details"
 * - Consistent spacing and punctuation
 *
 * @example
 * ```typescript
 * formatLogMessage(1, 'selectCell');           // "step 1: selectCell"
 * formatLogMessage(42, 'place', '(3,4) = 7');  // "step 42: place (3,4) = 7"
 * formatLogMessage(100, 'backtrack', 'from (2,1)'); // "step 100: backtrack from (2,1)"
 * ```
 */
export function formatLogMessage(stepCount: number, event: string, details?: string): string {
  const base = `step ${stepCount}: ${event}`;
  return details ? `${base} ${details}` : base;
}

/**
 * Converts board array to log-friendly string lines
 *
 * Transforms a 2D board array into an array of strings suitable for logging,
 * copying, or text export. Each row becomes a single string with concatenated
 * cell values.
 *
 * @param board - 2D array representing the Sudoku board
 * @returns Array of 9 strings, each representing one row of the board
 *
 * @output_format
 * - Each row becomes one string
 * - Cells are concatenated without separators
 * - Empty cells remain as '.' characters
 * - Digits remain as digit characters
 *
 * @example
 * ```typescript
 * const board = [
 *   ['5', '3', '.', '.', '7', '.', '.', '.', '.'],
 *   ['6', '.', '.', '1', '9', '5', '.', '.', '.'],
 *   // ... more rows
 * ];
 *
 * const lines = boardToLogLines(board);
 * // Result: ['53..7....', '6..195...', ...]
 *
 * // Usage for logging or export
 * console.log(lines.join('\n'));
 * navigator.clipboard.writeText(lines.join('\n'));
 * ```
 */
export function boardToLogLines(board: string[][]): string[] {
  return board.map(row => row.join(''));
}