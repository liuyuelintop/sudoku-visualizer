/**
 * @fileoverview Immer-Based Solver State Management - Optimized React State Hook
 *
 * Advanced React hook implementing Immer.js for structural sharing and optimal
 * performance in Sudoku solver state management. Provides immutable state updates
 * with minimal re-renders through sophisticated memoization and batching strategies.
 *
 * @module hooks/useSolverStateImmer
 * @version 1.0.0
 * @since Phase-2-Architecture-Finalization
 *
 * @architecture
 * - **Immer.js Integration**: Structural sharing for large state objects
 * - **Memoized Derivations**: Computed state with dependency tracking
 * - **Generator Management**: Efficient solver step iteration
 * - **Animation Coordination**: MRV scan timing and visual feedback
 *
 * @performance_optimizations
 * - Structural sharing prevents unnecessary object creation
 * - Derived state computation with useMemo dependency tracking
 * - Delta snapshots for incremental board change tracking
 * - Minimal re-render surface through selective state exposure
 *
 * @state_structure
 * ```typescript
 * ImmerCoreState {
 *   board: Board,                    // Current board state
 *   running: boolean,                // Solver execution status
 *   finished: boolean,               // Completion status
 *   history: EnhancedSolverSnapshot[], // Step history with deltas
 *   viewIndex: number | null,        // Timeline navigation
 *   currentStep: {                   // Current step state
 *     stepCount, highlight, trying, candidates,
 *     empties, usage, mrvIndex, mrvScan, mrvSwap,
 *     mrvScanPos, metrics
 *   }
 * }
 * ```
 *
 * @usage
 * ```typescript
 * const {
 *   board, running, finished,
 *   stepCount, highlight, trying, candidates,
 *   initializePuzzle, start, pause, stepOnce,
 *   startMrvScanAnimation
 * } = useSolverStateImmer();
 *
 * // Initialize with puzzle
 * initializePuzzle(puzzleBoard);
 *
 * // Control solving process
 * start(); // Begin automatic solving
 * stepOnce(); // Single step execution
 * pause(); // Pause solver
 * ```
 */

import { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import { produce, enableMapSet } from 'immer';
import { ANIMATION_CONFIG } from '../config/constants';
import type { Board, SolverStep, SolverSnapshot, SolverMetrics, MRVScanItem } from '../types/sudoku';
import { solveSudokuMRV } from '../lib/sudoku/solver';
import { cloneBoard, buildUsage } from '../lib/sudoku/board';

// Enable Immer optimizations
enableMapSet();

/**
 * Enhanced solver snapshot with delta tracking for performance optimization
 *
 * Extends the base SolverSnapshot with incremental change tracking to enable
 * efficient UI updates and minimize data transfer in step history.
 *
 * @enhancement_features
 * - **Delta Tracking**: Records only changes from previous snapshot
 * - **Board Diffs**: Specific cell changes with old/new values
 * - **Metrics Increments**: Only changed metric fields
 * - **Memory Efficiency**: Avoids full state duplication
 */
type EnhancedSolverSnapshot = SolverSnapshot & {
  /** Incremental changes from the previous snapshot for optimization */
  deltaFromPrevious?: {
    /** Specific board cell changes with before/after values */
    boardChanges?: Array<{ r: number; c: number; oldValue: string; newValue: string }>;
    /** Only the metrics that changed from previous step */
    metricsChange?: Partial<SolverMetrics>;
  };
};

/**
 * Core state structure optimized for Immer.js structural sharing
 *
 * Designed for efficient immutable updates with minimal object creation.
 * Immer automatically handles copy-on-write semantics for nested objects.
 *
 * @immer_benefits
 * - **Structural Sharing**: Unchanged parts of state are shared between versions
 * - **Copy-on-Write**: Only modified branches create new objects
 * - **Nested Updates**: Direct mutation syntax with immutable guarantees
 * - **Reference Equality**: Unchanged objects maintain === equality for React.memo
 *
 * @state_organization
 * - **Top Level**: Solver execution status and navigation
 * - **Current Step**: All state related to the current solving step
 * - **History**: Chronological step snapshots with delta optimization
 */
type ImmerCoreState = {
  /** Current board state during solving process */
  board: Board;
  /** Whether solver is actively running */
  running: boolean;
  /** Whether solving process has completed */
  finished: boolean;
  /** Complete history of solver steps with delta tracking */
  history: EnhancedSolverSnapshot[];
  /** Current position in history for timeline navigation (null = live) */
  viewIndex: number | null;
  /** All state related to the current solving step */
  currentStep: {
    /** Total number of steps executed */
    stepCount: number;
    /** Currently highlighted cell position */
    highlight: { r: number; c: number } | null;
    /** Cell and digit currently being attempted */
    trying: { r: number; c: number; d: number } | null;
    /** Valid candidates for current cell */
    candidates: number[];
    /** State of all empty cells with candidate counts */
    empties: Array<{ r: number; c: number; count: number; filled: boolean }>;
    /** Constraint usage tables for validation */
    usage: { rows: boolean[][]; cols: boolean[][]; boxes: boolean[][] } | null;
    /** Index of current cell in MRV empties array */
    mrvIndex: number;
    /** MRV scan visualization data */
    mrvScan: MRVScanItem[];
    /** MRV swap operation data */
    mrvSwap: { k: number; best: number } | null;
    /** Current position in MRV scan animation */
    mrvScanPos: number;
    /** Solver performance metrics */
    metrics: SolverMetrics;
  };
};

const initialImmerState: ImmerCoreState = {
  board: [],
  running: false,
  finished: false,
  history: [],
  viewIndex: null,
  currentStep: {
    stepCount: 0,
    highlight: null,
    trying: null,
    candidates: [],
    empties: [],
    usage: null,
    mrvIndex: -1,
    mrvScan: [],
    mrvSwap: null,
    mrvScanPos: 0,
    metrics: { steps: 0, selects: 0, tries: 0, places: 0, backtracks: 0, nodes: 0 }
  }
};

// Board diff utility for delta snapshots
function getBoardDelta(oldBoard: Board, newBoard: Board): Array<{ r: number; c: number; oldValue: string; newValue: string }> {
  const changes: Array<{ r: number; c: number; oldValue: string; newValue: string }> = [];

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (oldBoard[r]?.[c] !== newBoard[r]?.[c]) {
        changes.push({
          r, c,
          oldValue: oldBoard[r]?.[c] || '',
          newValue: newBoard[r]?.[c] || ''
        });
      }
    }
  }

  return changes;
}

/**
 * Advanced Immer-based solver state management hook
 *
 * Provides comprehensive state management for the Sudoku solver with optimal
 * performance through Immer.js structural sharing and memoized derivations.
 * Handles solver execution, timeline navigation, and animation coordination.
 *
 * @returns Object containing state values and control functions
 *
 * @state_management_features
 * - **Immer Integration**: Structural sharing for large state trees
 * - **Derived State**: Memoized computations with dependency tracking
 * - **Generator Control**: Solver step iteration and lifecycle management
 * - **Animation Timing**: MRV scan animation with interval management
 * - **Timeline Navigation**: History browsing with snapshot viewing
 *
 * @performance_characteristics
 * - Structural sharing prevents unnecessary object creation
 * - Memoized derivations avoid redundant calculations
 * - Selective re-render surface through careful state exposure
 * - Delta tracking in history for memory efficiency
 *
 * @example
 * ```typescript
 * const {
 *   // State values
 *   board, running, finished, stepCount,
 *   highlight, trying, candidates, emptiesView,
 *
 *   // Control functions
 *   initializePuzzle, start, pause, stepOnce,
 *   viewSnapshot, viewLive,
 *
 *   // Animation control
 *   startMrvScanAnimation, stopMrvScanAnimation
 * } = useSolverStateImmer();
 *
 * // Initialize and start solving
 * initializePuzzle(puzzleBoard);
 * start();
 * ```
 */
export function useSolverStateImmer() {
  // Core state: Immer-managed immutable state
  const [coreState, setCoreState] = useState<ImmerCoreState>(initialImmerState);

  // Generator reference
  const genRef = useRef<Generator<SolverStep, Board, unknown> | null>(null);
  const initialRef = useRef<Board>([]);

  // MRV scan animation
  const mrvScanIntervalRef = useRef<number | null>(null);



  // Derived state: optimized with useMemo
  const derivedState = useMemo(() => {
    const { currentStep, history } = coreState;

    return {
      // History arrays - optimized computation
      stepsHistory: Array.from({ length: currentStep.stepCount }, (_, i) => i + 1),
      nodesHistory: Array.from({ length: currentStep.stepCount }, (_, i) => Math.min(i + 1, currentStep.metrics.nodes)),
      backtracksHistory: Array.from({ length: currentStep.stepCount }, (_, i) => Math.min(i, currentStep.metrics.backtracks)),

      // Current state destructuring
      stepCount: currentStep.stepCount,
      highlight: currentStep.highlight,
      trying: currentStep.trying,
      candidates: currentStep.candidates,
      emptiesView: currentStep.empties,
      usageView: currentStep.usage,
      mrvIndex: currentStep.mrvIndex,
      mrvScan: currentStep.mrvScan,
      mrvSwap: currentStep.mrvSwap,
      mrvScanPos: currentStep.mrvScanPos,
      metrics: currentStep.metrics
    };
  }, [coreState.currentStep, coreState.history]);

  const initializePuzzle = useCallback((puzzle: Board) => {
    initialRef.current = cloneBoard(puzzle);
    genRef.current = null;

    // Use Immer's produce to create new state
    setCoreState(produce((draft) => {
      draft.board = puzzle;
      draft.running = false;
      draft.finished = false;
      draft.history = [];
      draft.viewIndex = null;
      draft.currentStep = {
        stepCount: 0,
        highlight: null,
        trying: null,
        candidates: [],
        empties: [],
        usage: null,
        mrvIndex: -1,
        mrvScan: [],
        mrvSwap: null,
        mrvScanPos: 0,
        metrics: { steps: 0, selects: 0, tries: 0, places: 0, backtracks: 0, nodes: 0 }
      };
    }));
  }, []);

  const reset = useCallback(() => {
    if (initialRef.current.length > 0) {
      initializePuzzle(initialRef.current);
    }
  }, [initializePuzzle]);

  const stepOnce = useCallback(() => {
    if (!genRef.current) {
      genRef.current = solveSudokuMRV(coreState.board);
    }

    const { value, done } = genRef.current.next();

    if (done) {
      // Use Immer to handle completion state
      if (value && Array.isArray(value)) {
        const finalBoard = value as Board;
        const solved = finalBoard.every(row => row.every(ch => ch !== '.'));

        setCoreState(produce((draft) => {
          draft.board = finalBoard;
          draft.running = false;
          draft.finished = true;

          // Create snapshot with structural sharing
          const snapshot = {
            idx: draft.history.length,
            event: 'final',
            board: finalBoard, // Immer automatically handles structural sharing
            highlight: null,
            trying: null,
            candidates: [],
            empties: [],
            usage: buildUsage(finalBoard),
            note: solved ? 'Solved' : 'No solution',
            deltaFromPrevious: {
              boardChanges: getBoardDelta(draft.board, finalBoard)
            }
          };
          draft.history.push(snapshot);

          // Reset current step state
          draft.currentStep.highlight = null;
          draft.currentStep.trying = null;
          draft.currentStep.candidates = [];
          draft.currentStep.empties = [];
          draft.currentStep.usage = null;
          draft.currentStep.mrvScan = [];
          draft.currentStep.mrvSwap = null;
          draft.currentStep.mrvScanPos = 0;
        }));
      } else {
        // Handle no-solution case - generator completed with value: false
        setCoreState(produce((draft) => {
          draft.running = false;
          draft.finished = true;

          // Create final snapshot for no-solution case
          const snapshot = {
            idx: draft.history.length,
            event: 'final',
            board: draft.board, // Keep current board state
            highlight: null,
            trying: null,
            candidates: [],
            empties: [],
            usage: buildUsage(draft.board),
            note: 'No solution',
            deltaFromPrevious: {
              boardChanges: [] // No board changes in no-solution case
            }
          };
          draft.history.push(snapshot);

          // Reset current step state
          draft.currentStep.highlight = null;
          draft.currentStep.trying = null;
          draft.currentStep.candidates = [];
          draft.currentStep.empties = [];
          draft.currentStep.usage = null;
          draft.currentStep.mrvScan = [];
          draft.currentStep.mrvSwap = null;
          draft.currentStep.mrvScanPos = 0;
        }));
      }

      genRef.current = null;
      return;
    }

    const step = value as SolverStep;

    // Core optimization: use Immer's produce for structural sharing updates
    setCoreState(produce((draft) => {
      const newStepCount = draft.currentStep.stepCount + 1;
      let newMetrics = { ...draft.currentStep.metrics, steps: newStepCount };
      let boardChanged = false;

      // Update step count
      draft.currentStep.stepCount = newStepCount;

      if (step.type === 'selectCell') {
        const newHighlight = { r: step.r, c: step.c };
        newMetrics = { ...newMetrics, selects: newMetrics.selects + 1, nodes: newMetrics.nodes + 1 };

        // Directly modify draft, Immer handles immutability
        draft.currentStep.highlight = newHighlight;
        draft.currentStep.candidates = step.candidates;
        draft.currentStep.trying = null;
        draft.currentStep.empties = step.empties; // Immer automatic structural sharing
        draft.currentStep.usage = step.usage; // Immer automatic structural sharing
        draft.currentStep.mrvIndex = step.index;
        draft.currentStep.mrvScan = step.scan; // Immer automatic structural sharing
        draft.currentStep.mrvSwap = step.swap;
        draft.currentStep.metrics = newMetrics;

        // Create snapshot with structural sharing
        const snapshot = {
          idx: draft.history.length,
          event: 'selectCell',
          board: draft.board, // Reference existing board, no cloning needed
          highlight: newHighlight,
          trying: null,
          candidates: [...step.candidates], // Only clone small arrays
          empties: step.empties, // Immer structural sharing
          usage: step.usage, // Immer structural sharing
          scan: step.scan, // Immer structural sharing
          swap: step.swap,
          note: `Select (${step.r + 1},${step.c + 1})`
        };
        draft.history.push(snapshot);

      } else if (step.type === 'tryDigit') {
        newMetrics = { ...newMetrics, tries: newMetrics.tries + 1 };

        draft.currentStep.trying = { r: step.r, c: step.c, d: step.d };
        draft.currentStep.metrics = newMetrics;

        const snapshot = {
          idx: draft.history.length,
          event: 'tryDigit',
          board: draft.board, // Structural sharing
          highlight: draft.currentStep.highlight,
          trying: { r: step.r, c: step.c, d: step.d },
          candidates: draft.currentStep.candidates, // Structural sharing
          empties: draft.currentStep.empties, // Structural sharing
          usage: draft.currentStep.usage // Structural sharing
        };
        draft.history.push(snapshot);

      } else if (step.type === 'place') {
        const oldBoard = draft.board;
        // Modify board - Immer automatically handles copy-on-write
        draft.board[step.r][step.c] = String(step.d);
        boardChanged = true;
        newMetrics = { ...newMetrics, places: newMetrics.places + 1 };

        draft.currentStep.trying = null;
        draft.currentStep.metrics = newMetrics;

        const snapshot = {
          idx: draft.history.length,
          event: 'place',
          board: draft.board, // Immer automatically handles copy-on-write
          highlight: { r: step.r, c: step.c },
          trying: null,
          candidates: draft.currentStep.candidates, // Structural sharing
          empties: draft.currentStep.empties, // Structural sharing
          usage: buildUsage(draft.board),
          note: `Place ${step.d} at (${step.r + 1},${step.c + 1})`,
          deltaFromPrevious: {
            boardChanges: [{ r: step.r, c: step.c, oldValue: oldBoard[step.r][step.c], newValue: String(step.d) }]
          }
        };
        draft.history.push(snapshot);

      } else if (step.type === 'backtrack') {
        const oldBoard = draft.board;
        // Modify board - Immer automatically handles copy-on-write
        draft.board[step.r][step.c] = '.';
        boardChanged = true;
        newMetrics = { ...newMetrics, backtracks: newMetrics.backtracks + 1 };

        draft.currentStep.trying = null;
        draft.currentStep.metrics = newMetrics;

        const snapshot = {
          idx: draft.history.length,
          event: 'backtrack',
          board: draft.board, // Immer automatically handles copy-on-write
          highlight: { r: step.r, c: step.c },
          trying: null,
          candidates: draft.currentStep.candidates, // Structural sharing
          empties: draft.currentStep.empties, // Structural sharing
          usage: buildUsage(draft.board),
          note: `Backtrack ${step.d} at (${step.r + 1},${step.c + 1})`,
          deltaFromPrevious: {
            boardChanges: [{ r: step.r, c: step.c, oldValue: oldBoard[step.r][step.c], newValue: '.' }]
          }
        };
        draft.history.push(snapshot);
      }
    }));

  }, [coreState.board]);

  const start = useCallback(() => {
    setCoreState(produce((draft) => {
      draft.running = true;
      draft.viewIndex = null;
    }));
  }, []);

  const pause = useCallback(() => {
    setCoreState(produce((draft) => {
      draft.running = false;
    }));
  }, []);

  const viewSnapshot = useCallback((index: number) => {
    setCoreState(produce((draft) => {
      draft.running = false;
      draft.viewIndex = index;
    }));
  }, []);

  const viewLive = useCallback(() => {
    setCoreState(produce((draft) => {
      draft.viewIndex = null;
    }));
  }, []);

  const updateMrvScanPos = useCallback((pos: number) => {
    setCoreState(produce((draft) => {
      draft.currentStep.mrvScanPos = pos;
    }));
  }, []);

  const startMrvScanAnimation = useCallback((scanLength: number) => {
    if (mrvScanIntervalRef.current) {
      window.clearInterval(mrvScanIntervalRef.current);
    }
    updateMrvScanPos(0);

    if (scanLength === 0) return;

    const interval = ANIMATION_CONFIG.MRV_SCAN_INTERVAL;
    mrvScanIntervalRef.current = window.setInterval(() => {
      setCoreState(produce((draft) => {
        const nextPos = draft.currentStep.mrvScanPos + 1;
        draft.currentStep.mrvScanPos = nextPos >= scanLength ? scanLength - 1 : nextPos;
      }));
    }, interval);
  }, [updateMrvScanPos]);

  const stopMrvScanAnimation = useCallback(() => {
    if (mrvScanIntervalRef.current) {
      window.clearInterval(mrvScanIntervalRef.current);
      mrvScanIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMrvScanAnimation();
    };
  }, [stopMrvScanAnimation]);

  return {
    // Core state
    board: coreState.board,
    running: coreState.running,
    finished: coreState.finished,
    history: coreState.history,
    viewIndex: coreState.viewIndex,

    // Derived state
    ...derivedState,

    // Actions
    initializePuzzle,
    reset,
    stepOnce,
    start,
    pause,
    viewSnapshot,
    viewLive,
    updateMrvScanPos,
    startMrvScanAnimation,
    stopMrvScanAnimation
  };
}