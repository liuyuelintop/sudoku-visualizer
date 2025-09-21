/**
 * @fileoverview Board View - Interactive Sudoku Grid Rendering Component
 *
 * Renders the 9x9 Sudoku board with comprehensive visual feedback including
 * highlighting, candidate overlays, conflict detection, and animation effects.
 * Provides real-time constraint visualization and interactive cell feedback.
 *
 * @module components/BoardView
 * @version 1.0.0
 * @since Phase-2-Architecture-Finalization
 *
 * @architecture
 * - **Visual Grid**: 9x9 cell layout with responsive design and visual hierarchy
 * - **State Visualization**: Highlights, conflicts, trying states, peer relationships
 * - **Candidate System**: Overlay digits and count badges for empty cells
 * - **Animation Support**: Pulse effects and visual transitions
 * - **Constraint Awareness**: Real-time constraint checking and visual feedback
 *
 * @visual_features
 * - **Cell Highlighting**: Current selection with amber highlighting
 * - **Peer Highlighting**: Same row/column/box with subtle background
 * - **Conflict Visualization**: Red highlighting for rule violations
 * - **Candidate Overlays**: Digit overlays and count badges for empty cells
 * - **Trying State**: Visual indication of digit placement attempts
 * - **Pulse Animation**: Attention-drawing effects for specific cells
 *
 * @performance_optimizations
 * - Constraint calculation cached per render cycle
 * - Conditional candidate computation based on display flags
 * - Memoized constraint usage building
 * - Efficient conflict set lookup with string keys
 */

import React, { useState } from 'react';
import type { Board } from '../types/sudoku';
import { buildUsage, canPlace, boxId } from '../lib/sudoku/board';

/**
 * Interactive Sudoku board component with comprehensive visual feedback
 *
 * Renders a 9x9 Sudoku grid with advanced visualization features including
 * cell highlighting, candidate display, conflict detection, and animation effects.
 * Integrates constraint checking for real-time visual feedback.
 *
 * @param props Component props for board rendering
 * @param props.board - 9x9 board state to render
 * @param props.highlight - Currently highlighted cell position
 * @param props.trying - Cell position and digit being attempted
 * @param props.showCandidateCounts - Whether to show candidate count badges
 * @param props.showCandidateDigits - Whether to show candidate digit overlays
 * @param props.conflictSet - Set of cell positions with rule violations
 * @param props.pulse - Cell position to animate with pulse effect
 * @returns JSX element rendering the interactive Sudoku board
 *
 * @features
 * - **Interactive Grid**: Row/column labels with highlighting coordination
 * - **Visual States**: Multiple visual states (highlight, trying, conflict, peer)
 * - **Candidate Display**: Real-time candidate calculation and overlay
 * - **Constraint Feedback**: Visual indication of rule violations
 * - **Responsive Design**: Adaptive layout with consistent cell sizing
 * - **Animation Support**: Pulse effects and smooth transitions
 *
 * @visual_hierarchy
 * ```
 * ┌─ Col Labels (1-9) ─┐
 * ├─ Row ─┬─ 9x9 Grid ─┤
 * │ (1-9) │ Cells with │
 * │ Labels│ • Digits   │
 * │       │ • Overlays │
 * │       │ • States   │
 * └───────┴────────────┘
 * ```
 *
 * @example
 * ```tsx
 * <BoardView
 *   board={currentBoard}
 *   highlight={{ r: 3, c: 4 }}
 *   trying={{ r: 3, c: 4, d: 7 }}
 *   showCandidateCounts={true}
 *   showCandidateDigits={true}
 *   conflictSet={new Set(['2,3', '4,5'])}
 *   pulse={{ r: 1, c: 2 }}
 * />
 * ```
 */
export default function BoardView({ board, highlight, trying, showCandidateCounts = true, showCandidateDigits = true, conflictSet, pulse }: { board: Board | undefined; highlight: { r: number; c: number } | null; trying: { r: number; c: number; d: number } | null; showCandidateCounts?: boolean; showCandidateDigits?: boolean; conflictSet?: Set<string>; pulse?: { r: number; c: number } | null }) {
  const safe = Array.isArray(board) && board.length === 9 ? board : Array.from({ length: 9 }, () => Array(9).fill('.'));
  const usage = buildUsage(safe);
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);

  const ColLabels = () => (
    <div className="grid grid-cols-9 gap-1">
      {Array.from({ length: 9 }, (_, i) => {
        const col = i;
        const isHL = !!highlight && highlight.c === col;
        return (
          <span key={i} className={["w-14 h-6 flex items-center justify-center text-xs font-bold rounded", isHL ? "bg-amber-200 text-amber-800" : "text-slate-300"].join(" ")}>{i+1}</span>
        );
      })}
    </div>
  );
  const RowLabels = () => (
    <div className="grid grid-rows-9 gap-1">
      {Array.from({ length: 9 }, (_, i) => {
        const row = i;
        const isHL = !!highlight && highlight.r === row;
        return (
          <span key={i} className={["w-6 h-14 flex items-center justify-center text-xs font-bold rounded", isHL ? "bg-amber-200 text-amber-800" : "text-slate-300"].join(" ")}>{i+1}</span>
        );
      })}
    </div>
  );

  return (
    <div className="inline-grid grid-cols-[auto_auto] grid-rows-[auto_auto] items-start gap-2">
      <div></div>
      <ColLabels />
      <RowLabels />
      <div className="grid grid-cols-9 gap-1 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-3xl shadow-2xl select-none border-4 border-slate-600 p-0">
        {safe.flatMap((row, r) =>
          row.map((cell, c) => {
            const isHL = !!highlight && highlight.r === r && highlight.c === c;
            const isTrying = !!trying && trying.r === r && trying.c === c;
            const isPeer = !!highlight && (highlight.r === r || highlight.c === c || boxId(highlight.r, highlight.c) === boxId(r, c));
            const isConflict = conflictSet ? conflictSet.has(`${r},${c}`) : false;
            let candCount = 0;
            const allowed: number[] = [];
            if (showCandidateCounts && cell === ".") {
              for (let d = 1; d <= 9; d++) if (canPlace(usage.rows, usage.cols, usage.boxes, r, c, d)) { candCount++; allowed.push(d); }
            } else if (cell === ".") {
              for (let d = 1; d <= 9; d++) if (canPlace(usage.rows, usage.cols, usage.boxes, r, c, d)) { allowed.push(d); }
            }
            const thickR = r === 2 || r === 5;
            const thickC = c === 2 || c === 5;
            const isPulse = !!pulse && pulse.r === r && pulse.c === c;
            return (
              <div
                key={`${r}-${c}`}
                className={[
                  "w-14 h-14 flex items-center justify-center text-xl font-bold transition-all duration-300 rounded-xl relative overflow-hidden",
                  "backdrop-blur-sm border-2",
                  cell !== "."
                    ? (isConflict ? "bg-rose-50 text-rose-700 border-rose-300 shadow-lg" : "bg-white text-slate-800 border-slate-200 shadow-lg")
                    : (isConflict ? "bg-rose-50/80 text-rose-700 border-rose-300" : (isPeer ? "bg-indigo-50/80 text-slate-400 border-slate-300/50" : "bg-slate-100/90 text-slate-400 border-slate-300/50 hover:bg-slate-50")),
                  isHL
                    ? "ring-4 ring-amber-400 ring-opacity-60 bg-gradient-to-br from-amber-100 to-amber-200 text-amber-900 border-amber-300 shadow-xl scale-110 z-10"
                    : "",
                  isTrying
                    ? "bg-gradient-to-br from-blue-100 to-indigo-200 text-indigo-700 border-indigo-300 animate-pulse"
                    : "",
                  isPulse ? "outline outline-2 outline-indigo-300" : "",
                  thickR ? "border-b-4 border-b-slate-600" : "",
                  thickC ? "border-r-4 border-r-slate-600" : "",
                ].join(" ")}
                onMouseEnter={() => setHover({ r, c })}
                onMouseLeave={() => setHover((h) => (h && h.r === r && h.c === c ? null : h))}
              >
                {cell !== "." ? (
                  <span className="drop-shadow-sm">{cell}</span>
                ) : isTrying ? (
                  <span className="animate-bounce drop-shadow-sm">{trying.d}</span>
                ) : (
                  <span className="opacity-30 text-2xl">·</span>
                )}

                {showCandidateCounts && cell === "." && (
                  <span className={[
                    "absolute top-0.5 right-1 text-[10px] font-black px-1 py-[1px] rounded",
                    candCount === 0 ? "bg-rose-100 text-rose-700" : candCount === 1 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                  ].join(" ")}>{candCount}</span>
                )}

                {/* Highlight glow effect */}
                {isHL && (
                  <div className="absolute inset-0 bg-gradient-radial from-amber-300/20 to-transparent animate-pulse" />
                )}

                {/* Candidate digits overlay on hover */}
                {showCandidateDigits && cell === "." && hover && hover.r === r && hover.c === c && allowed.length > 0 && (
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[1px] p-1 bg-white/80 rounded-lg border border-slate-200">
                    {Array.from({ length: 9 }, (_, i) => i+1).map((d) => (
                      <div key={d} className={["flex items-center justify-center text-[10px] rounded", allowed.includes(d) ? "text-slate-800" : "text-slate-300"].join(" ")}>{d}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
