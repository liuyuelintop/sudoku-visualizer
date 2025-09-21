/**
 * @fileoverview Visualization State Management - UI State and Animation Hook
 *
 * Specialized React hook managing UI-specific state for the Sudoku solver
 * visualization including animations, logging, timing, and visual feedback.
 * Provides clean separation between solver logic and presentation concerns.
 *
 * @module hooks/useVisualization
 * @version 1.0.0
 * @since Phase-2-Architecture-Finalization
 *
 * @architecture
 * - **Separation of Concerns**: UI state isolated from solver logic
 * - **Animation Management**: Interval-based animations with cleanup
 * - **Timer Coordination**: Precise elapsed time tracking for performance metrics
 * - **Logging System**: Bounded log collection with overflow protection
 *
 * @responsibilities
 * - **Animation Control**: MRV scan animation timing and positioning
 * - **Timer Management**: Start/stop/reset timer with accurate elapsed time tracking
 * - **Log Management**: Step logging with size limits and array operations
 * - **UI Settings**: Speed control, board logging toggles, visual preferences
 *
 * @performance_considerations
 * - Bounded log array prevents memory leaks (3000 item limit)
 * - Timer uses intervals for smooth UI updates (250ms refresh)
 * - Animation cleanup prevents interval leaks on unmount
 * - Memoized callbacks prevent unnecessary re-renders
 *
 * @usage
 * ```typescript
 * const {
 *   // Visual state
 *   speed, logs, logBoards, elapsedMs, mrvScanPos,
 *
 *   // Configuration
 *   setSpeed, setLogBoards,
 *
 *   // Logging
 *   addLog, clearLogs,
 *
 *   // Timer control
 *   startTimer, stopTimer, resetTimer,
 *
 *   // Animation control
 *   startMrvScanAnimation, stopMrvScanAnimation
 * } = useVisualization();
 * ```
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ANIMATION_CONFIG } from '../config/constants';

/**
 * Visualization state management hook for UI concerns
 *
 * Manages all visual aspects of the Sudoku solver including animations,
 * timing, logging, and user interface state. Designed to complement
 * the core solver state management with presentation-layer functionality.
 *
 * @returns Object containing visualization state and control functions
 *
 * @state_categories
 * - **Animation State**: MRV scan position and timing control
 * - **Timer State**: Elapsed time tracking for performance measurement
 * - **Logging State**: Step-by-step log collection with size management
 * - **UI Preferences**: Speed settings, logging options, visual toggles
 *
 * @interval_management
 * Handles multiple browser intervals with proper cleanup:
 * - MRV scan animation intervals for visual stepping
 * - Elapsed time update intervals for live timer display
 * - Automatic cleanup on component unmount
 *
 * @example
 * ```typescript
 * function SudokuVisualization() {
 *   const visualization = useVisualization();
 *
 *   useEffect(() => {
 *     // Start timing when solver begins
 *     visualization.startTimer();
 *     visualization.addLog('Solver started');
 *
 *     return () => {
 *       visualization.stopTimer();
 *     };
 *   }, []);
 *
 *   return (
 *     <div>
 *       <div>Speed: {visualization.speed}ms</div>
 *       <div>Elapsed: {visualization.elapsedMs}ms</div>
 *       <LogPanel logs={visualization.logs} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useVisualization() {
  // UI-specific state
  const [speed, setSpeed] = useState(300);
  const [logs, setLogs] = useState<string[]>([]);
  const [logBoards, setLogBoards] = useState(true);
  const [elapsedMs, setElapsedMs] = useState(0);

  // MRV scan animation
  const [mrvScanPos, setMrvScanPos] = useState(0);
  const mrvScanIntervalRef = useRef<number | null>(null);

  // Timer references
  const runStartRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);

  // Logging
  const addLog = useCallback((lines: string | string[]) => {
    const arr = Array.isArray(lines) ? lines : [lines];
    setLogs((prev) => {
      const next = prev.concat(arr);
      const MAX = 3000;
      return next.length > MAX ? next.slice(next.length - MAX) : next;
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Timer management
  const startTimer = useCallback(() => {
    if (runStartRef.current == null) {
      runStartRef.current = Date.now();
    }
    if (!elapsedTimerRef.current) {
      elapsedTimerRef.current = window.setInterval(() => {
        if (runStartRef.current != null) {
          setElapsedMs(base => base + (Date.now() - runStartRef.current!));
          runStartRef.current = Date.now();
        }
      }, 250);
    }
  }, []);

  const stopTimer = useCallback(() => {
    if (elapsedTimerRef.current) {
      window.clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    if (runStartRef.current != null) {
      setElapsedMs(base => base + (Date.now() - runStartRef.current!));
      runStartRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    setElapsedMs(0);
    runStartRef.current = null;
  }, [stopTimer]);

  // MRV scan animation
  const startMrvScanAnimation = useCallback((scanLength: number) => {
    if (mrvScanIntervalRef.current) {
      window.clearInterval(mrvScanIntervalRef.current);
    }
    setMrvScanPos(0);

    if (scanLength === 0) return;

    const interval = ANIMATION_CONFIG.MRV_SCAN_INTERVAL;
    mrvScanIntervalRef.current = window.setInterval(() => {
      setMrvScanPos(pos => (pos + 1 >= scanLength ? scanLength - 1 : pos + 1));
    }, interval);
  }, []);

  const stopMrvScanAnimation = useCallback(() => {
    if (mrvScanIntervalRef.current) {
      window.clearInterval(mrvScanIntervalRef.current);
      mrvScanIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      stopMrvScanAnimation();
    };
  }, [stopTimer, stopMrvScanAnimation]);

  return {
    // State
    speed,
    logs,
    logBoards,
    elapsedMs,
    mrvScanPos,

    // Actions
    setSpeed,
    setLogBoards,
    addLog,
    clearLogs,
    startTimer,
    stopTimer,
    resetTimer,
    startMrvScanAnimation,
    stopMrvScanAnimation
  };
}