/**
 * @fileoverview Sudoku Controller - Business Logic Orchestration Hook
 *
 * Master orchestration hook that coordinates all aspects of the Sudoku solver
 * application. Combines state management, visualization, validation, and user
 * interactions into a unified interface for the UI components.
 *
 * @module hooks/useSudokuController
 * @version 1.0.0
 * @since Phase-2-Architecture-Finalization
 *
 * @architecture
 * - **Composition Pattern**: Combines specialized hooks (useSolverStateImmer, useVisualization)
 * - **Business Logic Layer**: Handles validation, sample management, user actions
 * - **Effect Coordination**: Manages timer effects, animation triggers, logging
 * - **Unified Interface**: Single hook exposing complete controller functionality
 *
 * @responsibilities
 * - **Solver Control**: Start, pause, step, reset operations with validation
 * - **Sample Management**: Built-in puzzle collection with loading capabilities
 * - **Validation Coordination**: Dual validation system (legacy + comprehensive)
 * - **Animation Management**: MRV scan timing and visual feedback coordination
 * - **Logging Integration**: Comprehensive step logging with optional board snapshots
 * - **Timer Management**: Automatic stepping with configurable speed
 *
 * @hook_composition
 * ```typescript
 * useSudokuController() {
 *   const solver = useSolverStateImmer();      // Core state management
 *   const visualization = useVisualization(); // UI state and animations
 *   // + business logic, validation, effects
 *   return { ...solver, ...visualization, enhancedActions };
 * }
 * ```
 *
 * @usage
 * ```typescript
 * const controller = useSudokuController();
 *
 * // Solver control
 * controller.onStart();  // Start solving with validation
 * controller.onPause();  // Pause with timer cleanup
 * controller.onStep();   // Single step execution
 *
 * // Sample management
 * controller.loadSample('medium'); // Load built-in puzzle
 * controller.onPaste(); // Paste custom puzzle
 *
 * // State access
 * const { board, running, validation, logs } = controller;
 * ```
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSolverStateImmer } from './useSolverStateImmer';
import { useVisualization } from './useVisualization';
import { validateBoard as legacyValidateBoard } from '../lib/sudoku/validation';
import { validateBoard, createBoardFromString } from '../utils/validation';
import type { Board, ValidationIssue } from '../types/sudoku';
import { formatLogMessage, boardToLogLines } from '../utils/formatting';
import { isFeatureEnabled, PerformanceTracker } from '../config/featureFlags';

/**
 * Master Sudoku controller hook orchestrating all application functionality
 *
 * Provides a complete interface for Sudoku solver operations by combining
 * specialized state management hooks with business logic, validation,
 * and user interaction handling.
 *
 * @returns Complete controller interface with state and actions
 *
 * @features
 * - **Integrated State Management**: Combines solver state and visualization state
 * - **Dual Validation**: Legacy UI validation + comprehensive input validation
 * - **Sample Library**: Built-in puzzle collection with difficulty levels
 * - **Enhanced Actions**: Validation-aware solver controls with logging
 * - **Auto-stepping**: Timer-based automatic solving with speed control
 * - **Timeline Navigation**: History browsing with animation coordination
 * - **Performance Tracking**: Optional performance monitoring integration
 *
 * @state_composition
 * Returns combined state from:
 * - `useSolverStateImmer`: Core solver state with Immer optimization
 * - `useVisualization`: UI state, animations, and logging
 * - Local state: Sample selection, validation results, timer management
 *
 * @example
 * ```typescript
 * function SudokuApp() {
 *   const controller = useSudokuController();
 *
 *   return (
 *     <div>
 *       <BoardView board={controller.board} highlight={controller.highlight} />
 *       <Controls
 *         onStart={controller.onStart}
 *         onPause={controller.onPause}
 *         running={controller.running}
 *       />
 *       <SampleSelector
 *         samples={controller.samples}
 *         onLoad={controller.loadSample}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function useSudokuController() {
  // Sample puzzles
  const SAMPLES: { key: string; name: string; rows: string[] }[] = [
    { key: 'classic', name: 'Classic (LeetCode)', rows: [
      '53..7....','6..195...','.98....6.','8...6...3','4..8.3..1','7...2...6','.6....28.','...419..5','....8..79',
    ]},
    { key: 'easy', name: 'Easy', rows: [
      '.1.7..4.2','..9..1..7','..7...9..','..8.5.1..','7.......4','..1.9.3..','..3...6..','4..8..2..','6.2..7.8.',
    ]},
    { key: 'medium', name: 'Medium', rows: [
      '..9748...','7........','.2.1.9...','..7...24.','.64.1.59.','.98...3..','...8.3.2.','........6','...2759..',
    ]},
    { key: 'hard', name: 'Hard', rows: [
      '1..9.7..3','.8.....7.','..7...8..','.7...5...','..1.3.2..','...4...5.','..2...6..','.6.....1.','9..5.1..8',
    ]},
  ];

  const [sampleKey, setSampleKey] = useState<string>(SAMPLES[0].key);
  const [validation, setValidation] = useState<{
    issues: ValidationIssue[];
    conflictSet: Set<string>;
    comprehensive: { errors: string[]; warnings: string[] };
  }>({
    issues: [],
    conflictSet: new Set(),
    comprehensive: { errors: [], warnings: [] }
  });

  // Timer reference for automatic stepping
  const timerRef = useRef<number | null>(null);

  // Use production-ready Immer-based state management
  const solver = useSolverStateImmer();
  const visualization = useVisualization();

  // Combined validation function
  const validateBoardComprehensively = useCallback((board: Board) => {
    const legacyResult = legacyValidateBoard(board);
    const comprehensiveResult = validateBoard(board);

    return {
      issues: legacyResult.issues,
      conflictSet: legacyResult.conflictSet,
      comprehensive: {
        errors: comprehensiveResult.errors,
        warnings: comprehensiveResult.warnings
      }
    };
  }, []);

  // Performance tracking
  useEffect(() => {
    if (isFeatureEnabled('ENABLE_PERFORMANCE_TRACKING')) {
      PerformanceTracker.trackRender('useSudokuController');
    }
  });

  // Initialize with default sample
  useEffect(() => {
    const defaultSample = SAMPLES[0];
    const board = defaultSample.rows.map(r => r.split(''));
    solver.initializePuzzle(board);
    setValidation(validateBoardComprehensively(board));
    visualization.addLog([`action: load sample — ${defaultSample.name}`, ...defaultSample.rows]);
  }, []); // Only run once on mount

  // Auto-step timer effect
  useEffect(() => {
    if (!solver.running) return;

    const tick = () => {
      solver.stepOnce();
      timerRef.current = window.setTimeout(tick, visualization.speed);
    };

    timerRef.current = window.setTimeout(tick, visualization.speed);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [solver.running, visualization.speed, solver.stepOnce]);

  // MRV scan animation effect
  useEffect(() => {
    const activeScan = solver.viewIndex !== null ? (solver.history[solver.viewIndex]?.scan || []) : solver.mrvScan;
    const shouldAnimate = activeScan.length > 0 && (!solver.running || solver.viewIndex !== null);

    // Smart animation skipping: only animate for selectCell events to avoid repetitive scans
    const currentStep = solver.viewIndex !== null ? solver.history[solver.viewIndex] : solver.history[solver.history.length - 1];
    const shouldSkipAnimation = currentStep?.event === 'tryDigit' || currentStep?.event === 'place';

    if (shouldAnimate && !shouldSkipAnimation) {
      visualization.startMrvScanAnimation(activeScan.length);
    } else {
      visualization.stopMrvScanAnimation();
    }
  }, [solver.running, solver.viewIndex, solver.mrvScan, solver.history, visualization.startMrvScanAnimation, visualization.stopMrvScanAnimation]);

  // Enhanced actions with logging
  const onStart = useCallback(() => {
    if (!solver.running && !solver.finished) {
      if (validation.issues.length > 0) {
        alert('Board has validation issues. Please fix duplicates or invalid chars.');
        return;
      }
    }

    if (solver.finished && solver.board.every(row => row.every(ch => ch !== '.'))) {
      visualization.addLog('action: restart from initial and start');
      visualization.resetTimer();
    }

    solver.start();
    visualization.startTimer();
    visualization.addLog('action: start');
  }, [solver, validation.issues, visualization]);

  const onPause = useCallback(() => {
    solver.pause();
    visualization.stopTimer();
    visualization.addLog('action: pause');
  }, [solver, visualization]);

  const onReset = useCallback(() => {
    solver.reset();
    visualization.resetTimer();
    visualization.clearLogs();
    visualization.addLog('action: reset to initial');
  }, [solver, visualization]);

  const onStep = useCallback(() => {
    if (solver.running) return; // Don't step manually while auto-running
    solver.stepOnce();
    visualization.addLog('action: manual step');
  }, [solver, visualization]);

  const loadSample = useCallback((key: string) => {
    const sample = SAMPLES.find(s => s.key === key) || SAMPLES[0];
    setSampleKey(sample.key);

    const board = sample.rows.map(r => r.split(''));
    solver.initializePuzzle(board);
    setValidation(validateBoardComprehensively(board));
    visualization.resetTimer();
    visualization.addLog([`action: load sample — ${sample.name}`, ...sample.rows]);
  }, [solver, visualization]);

  const onPaste = useCallback(() => {
    const txt = prompt("Paste 9 lines (use '.' for empty). Example: .97..3..1\n8..1.2..3\n..3.....6\n..5.1.7..\n.1.....8.\n..9.8.5..\n6.....9..\n4..9.3..5\n2..4..81.");
    if (!txt) return;

    const { board, validation: validationResult } = createBoardFromString(txt);

    if (!board || !validationResult.isValid) {
      const errorMessage = validationResult.errors.join('\n');
      alert(`Invalid input:\n${errorMessage}`);
      return;
    }

    solver.initializePuzzle(board);
    setValidation(validateBoardComprehensively(board));
    visualization.resetTimer();
    visualization.addLog(['action: paste initial board', ...boardToLogLines(board)]);

    // Log warnings if any
    if (validationResult.warnings.length > 0) {
      visualization.addLog(['warnings:', ...validationResult.warnings]);
    }
  }, [solver, visualization, validateBoardComprehensively]);

  const onViewSnapshot = useCallback((index: number) => {
    solver.viewSnapshot(index);
    visualization.stopTimer();
  }, [solver, visualization]);

  const onViewLive = useCallback(() => {
    solver.viewLive();
  }, [solver]);

  // Enhanced step logging
  useEffect(() => {
    if (solver.stepCount === 0) return;

    const lastSnapshot = solver.history[solver.history.length - 1];
    if (!lastSnapshot) return;

    let logMessage = '';
    let boardLines: string[] = [];

    switch (lastSnapshot.event) {
      case 'selectCell':
        logMessage = formatLogMessage(solver.stepCount, `selectCell (${lastSnapshot.highlight!.r + 1},${lastSnapshot.highlight!.c + 1}) candidates=[${lastSnapshot.candidates.join(', ')}]`);
        break;
      case 'tryDigit':
        logMessage = formatLogMessage(solver.stepCount, `tryDigit ${lastSnapshot.trying!.d} at (${lastSnapshot.trying!.r + 1},${lastSnapshot.trying!.c + 1})`);
        break;
      case 'place':
        const placeMatch = lastSnapshot.note?.match(/Place\s+(\d+)/);
        const placeDigit = placeMatch ? placeMatch[1] : '?';
        logMessage = formatLogMessage(solver.stepCount, `place ${placeDigit} at (${lastSnapshot.highlight!.r + 1},${lastSnapshot.highlight!.c + 1})`);
        if (visualization.logBoards) {
          boardLines = boardToLogLines(lastSnapshot.board);
        }
        break;
      case 'backtrack':
        logMessage = formatLogMessage(solver.stepCount, `backtrack at (${lastSnapshot.highlight!.r + 1},${lastSnapshot.highlight!.c + 1})`);
        if (visualization.logBoards) {
          boardLines = boardToLogLines(lastSnapshot.board);
        }
        break;
      case 'final':
        const isSolved = lastSnapshot.board.every(row => row.every(ch => ch !== '.'));
        logMessage = `finished: ${isSolved ? 'solved' : 'no solution'}`;
        boardLines = ['final board:', ...boardToLogLines(lastSnapshot.board)];
        break;
    }

    if (logMessage) {
      visualization.addLog(boardLines.length > 0 ? [logMessage, ...boardLines] : logMessage);
    }
  }, [solver.stepCount, solver.history, visualization.logBoards, visualization.addLog]);

  // --- New: Log to developer console ---
  useEffect(() => {
    if (visualization.logs.length === 0) return;
    const lastLog = visualization.logs[visualization.logs.length - 1];
    console.log(lastLog);
  }, [visualization.logs]);

  return {
    // Combined state from both hooks
    ...solver,
    ...visualization,

    // Additional state
    sampleKey,
    validation,
    samples: SAMPLES,

    // Enhanced actions
    onStart,
    onPause,
    onReset,
    onStep,
    onViewSnapshot,
    onViewLive,
    loadSample,
    onPaste
  };
}