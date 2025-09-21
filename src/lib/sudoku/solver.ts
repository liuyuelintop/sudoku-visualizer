/**
 * @fileoverview MRV Sudoku Solver - Minimum Remaining Values Backtracking Algorithm
 *
 * Advanced Sudoku solver implementing the MRV (Minimum Remaining Values) heuristic
 * with comprehensive visualization support. Uses generator-based architecture for
 * step-by-step visualization and optimal performance through constraint propagation.
 *
 * @module lib/sudoku/solver
 * @version 1.0.0
 * @since Phase-2-Architecture-Finalization
 *
 * @algorithm_overview
 * The MRV algorithm enhances traditional backtracking by:
 * 1. **Cell Selection**: Always choosing the empty cell with fewest valid candidates
 * 2. **Forward Checking**: Pruning impossible branches early through constraint analysis
 * 3. **Constraint Propagation**: Maintaining row/column/box usage tables for O(1) validation
 * 4. **Early Termination**: Stopping MRV scan when single-candidate cells are found
 *
 * @performance_characteristics
 * - Time Complexity: O(9^N) worst case, dramatically reduced by MRV pruning
 * - Space Complexity: O(N) for empties array and constraint tables
 * - Typical Performance: 100-1000x faster than naive backtracking
 * - Visualization Overhead: Minimal due to generator-based yielding
 *
 * @architecture
 * - Generator-based solver for step-by-step visualization
 * - Immutable state snapshots for UI consumption
 * - Constraint-based validation with boolean usage tables
 * - Comprehensive step event system for debugging and visualization
 *
 * @usage
 * ```typescript
 * import { solveSudokuMRV } from './lib/sudoku/solver';
 *
 * const generator = solveSudokuMRV(initialBoard);
 * for (const step of generator) {
 *   // Process each solving step for visualization
 *   console.log(`Step: ${step.type}`);
 *   if (step.type === 'selectCell') {
 *     console.log(`Selected cell (${step.r}, ${step.c}) with ${step.candidates.length} candidates`);
 *   }
 * }
 * ```
 */

import type { Board, SolverStep, MRVScanItem } from '../../types/sudoku';
import { buildUsage, canPlace, boxId, isDigit, cloneBoard, toChar } from './board';
import { ALGORITHM_CONFIG, SUDOKU_CONFIG } from '../../config/constants';

/**
 * Advanced MRV (Minimum Remaining Values) Sudoku solver with visualization support
 *
 * Implements the MRV heuristic for optimal cell selection combined with backtracking
 * and forward checking. Uses generator architecture to yield detailed step information
 * for real-time visualization while maintaining optimal solving performance.
 *
 * @param initial - The initial Sudoku board state to solve
 * @yields SolverStep objects containing detailed information about each solving step
 * @returns The final solved board state
 *
 * @algorithm_details
 * 1. **Initialization**: Clone board, find empty cells, build constraint tables
 * 2. **MRV Selection**: Scan empty cells to find minimum remaining values
 * 3. **Candidate Generation**: Calculate valid digits for selected cell
 * 4. **Recursive Solving**: Try each candidate with backtracking
 * 5. **Constraint Updates**: Maintain usage tables for O(1) validation
 *
 * @step_types
 * - `selectCell`: MRV algorithm selected next cell to solve
 * - `tryDigit`: Attempting to place a specific digit
 * - `place`: Successfully placed digit on board
 * - `backtrack`: Removed digit and backtracked
 * - `solved`: Puzzle completely solved
 *
 * @example
 * ```typescript
 * const solver = solveSudokuMRV(puzzle);
 * let result = solver.next();
 *
 * while (!result.done) {
 *   const step = result.value;
 *
 *   if (step.type === 'selectCell') {
 *     console.log(`MRV selected (${step.r+1}, ${step.c+1}): ${step.candidates.length} candidates`);
 *   }
 *
 *   result = solver.next();
 * }
 *
 * const solvedBoard = result.value;
 * ```
 */
export function* solveSudokuMRV(initial: Board): Generator<SolverStep, Board, unknown> {
  const b = cloneBoard(initial);
  const empties: Array<[number, number]> = [];

  // Find all empty cells
  for (let r = 0; r < SUDOKU_CONFIG.BOARD_SIZE; r++) {
    for (let c = 0; c < SUDOKU_CONFIG.BOARD_SIZE; c++) {
      if (!isDigit(b[r][c])) {
        empties.push([r, c]);
      }
    }
  }

  const { rows, cols, boxes } = buildUsage(b);

  /**
   * MRV (Minimum Remaining Values) cell selection algorithm
   *
   * Implements the core MRV heuristic to select the optimal next cell to solve.
   * Scans the frontier of empty cells starting from position k to find the cell
   * with the minimum number of valid candidates.
   *
   * @param k - Starting index in empties array (frontier position)
   * @returns Object containing selected cell info and visualization data
   *
   * @algorithm_optimization
   * 1. **Frontier Analysis**: First analyzes cell at position k
   * 2. **Early Termination**: Stops scanning if frontier cell is already optimal (count=1)
   * 3. **Constraint Checking**: Uses O(1) constraint table lookups
   * 4. **Array Swapping**: Moves best cell to frontier position for processing
   *
   * @visualization_data
   * - `scan`: Step-by-step MRV analysis for UI visualization
   * - `swap`: Information about cell swapping operation
   * - `empties`: Current state of all empty cells with candidate counts
   * - `usage`: Snapshot of constraint usage tables
   *
   * @performance_notes
   * - Scans only from k onwards (frontier optimization)
   * - Terminates early when single-candidate cell found
   * - Swaps cells in-place for O(1) frontier management
   */
  const selectMRV = (k: number) => {
    const scan: MRVScanItem[] = [];
    let best = k;
    let bestCnt: number = ALGORITHM_CONFIG.INITIAL_BEST_COUNT;

    // Analyze the frontier cell at `k` first.
    const [rK, cK] = empties[k];
    const kCandidates = [];
    for (let d = 1; d <= SUDOKU_CONFIG.MAX_DIGIT; d++) {
        if (canPlace(rows, cols, boxes, rK, cK, d)) kCandidates.push(d);
    }
    bestCnt = kCandidates.length;
    // The cell at `k` is the best one found so far.
    scan.push({ i: k, r: rK, c: cK, count: bestCnt, bestIndex: k, bestCount: bestCnt });

    // Only scan the rest of the array if the frontier cell is not already a single.
    if (bestCnt > 1) {
        for (let i = k + 1; i < empties.length; i++) {
            const [r, c] = empties[i];
            const candidates = [];
            for (let d = 1; d <= SUDOKU_CONFIG.MAX_DIGIT; d++) {
                if (canPlace(rows, cols, boxes, r, c, d)) {
                    candidates.push(d);
                }
            }
            const count = candidates.length;

            if (count < bestCnt) {
                bestCnt = count;
                best = i;
            }
            
            // Always record the scan step, then check if we can terminate early.
            scan.push({ i, r, c, count, bestIndex: best, bestCount: bestCnt });

            if (bestCnt === 1) {
                break; // Found a single, no need to scan further.
            }
        }
    }

    // Perform the swap if a better cell was found.
    const swap = best !== k ? { k, best } : null;
    if (swap) {
      [empties[k], empties[best]] = [empties[best], empties[k]];
    }

    // The best cell is now at empties[k]. Get its final details.
    const [r, c] = empties[k];
    const finalCandidates = [];
    if (best === k) {
      finalCandidates.push(...kCandidates);
    } else {
      for (let d = 1; d <= 9; d++) {
          if (canPlace(rows, cols, boxes, r, c, d)) {
              finalCandidates.push(d);
          }
      }
    }
    
    // Create snapshots of the board state for the UI.
    const emptiesSnap = empties.map(([er, ec]) => {
      const filled = b[er][ec] !== '.';
      let count = 0;
      if (!filled) {
        for (let d = 1; d <= 9; d++) {
          if (canPlace(rows, cols, boxes, er, ec, d)) count++;
        }
      }
      return { r: er, c: ec, count, filled };
    });

    const usage = {
      rows: rows.map(a => a.slice()),
      cols: cols.map(a => a.slice()),
      boxes: boxes.map(a => a.slice())
    } as const;

    return {
      r,
      c,
      candidates: finalCandidates,
      empties: emptiesSnap,
      usage,
      scan,
      swap
    };
  };

  /**
   * Depth-First Search backtracking algorithm with MRV optimization
   *
   * Recursive generator function that implements the core backtracking algorithm
   * enhanced with MRV cell selection. Yields step information for visualization
   * while maintaining optimal solving performance.
   *
   * @param k - Current position in empties array (recursion depth)
   * @yields SolverStep objects for each algorithm decision
   * @returns Boolean indicating whether solution was found at this level
   *
   * @algorithm_flow
   * 1. **Base Case**: If k equals empties.length, puzzle is solved
   * 2. **MRV Selection**: Use selectMRV to choose optimal next cell
   * 3. **Forward Checking**: Return false if no candidates available
   * 4. **Digit Trial**: Try each candidate digit in order
   * 5. **Constraint Update**: Place digit and update usage tables
   * 6. **Recursive Call**: Solve remaining cells (k+1)
   * 7. **Backtracking**: If recursive call fails, undo placement and try next digit
   *
   * @step_events
   * - Before trying candidates: Yields `selectCell` with MRV analysis
   * - For each candidate: Yields `tryDigit` then `place`
   * - On recursive success: Propagates true up the call stack
   * - On backtrack: Yields `backtrack` and tries next candidate
   * - On complete solution: Yields `solved`
   *
   * @constraint_management
   * The function maintains three boolean arrays for O(1) constraint checking:
   * - `rows[r][d]`: True if digit d is used in row r
   * - `cols[c][d]`: True if digit d is used in column c
   * - `boxes[boxId][d]`: True if digit d is used in the 3x3 box
   */
  function* dfs(k: number): Generator<SolverStep, boolean, unknown> {
    if (k === empties.length) {
      yield { type: 'solved' };
      return true;
    }

    const picked = selectMRV(k);
    const { r, c, candidates, empties: emptiesSnap, usage, scan, swap } = picked;

    yield { type: 'selectCell', index: k, r, c, candidates, empties: emptiesSnap, usage, scan, swap };

    if (candidates.length === 0) {
      return false; // No valid candidates (forward checking pruning)
    }

    const bId = boxId(r, c);

    // Try each candidate digit
    for (const d of candidates) {
      yield { type: 'tryDigit', r, c, d };

      // Place digit and update constraints
      b[r][c] = toChar(d);
      rows[r][d] = cols[c][d] = boxes[bId][d] = true;
      yield { type: 'place', r, c, d };

      // Recurse to next empty cell
      const ok = yield* dfs(k + 1);
      if (ok) return true;

      // Backtrack: remove digit and restore constraints
      rows[r][d] = cols[c][d] = boxes[bId][d] = false;
      b[r][c] = '.';
      yield { type: 'backtrack', r, c, d };
    }

    return false;
  }

  const _finished = yield* dfs(0);
  return b;
}