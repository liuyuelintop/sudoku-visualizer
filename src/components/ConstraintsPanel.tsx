/**
 * @fileoverview Constraints Panel - Sudoku Constraint Analysis Component
 *
 * Interactive constraint visualization component providing detailed analysis of
 * Sudoku constraint violations and available candidates for highlighted cells.
 * Educates users about constraint propagation and rule interactions.
 *
 * @module components/ConstraintsPanel
 * @version 1.0.0
 * @since Phase-2-Architecture-Finalization
 *
 * @architecture
 * - **Constraint Visualization**: Row, column, and box constraint display
 * - **Contextual Analysis**: Cell-specific constraint evaluation
 * - **Conflict Detection**: Visual indication of digit conflicts
 * - **Educational Interface**: Progressive disclosure of constraint logic
 * - **Real-time Updates**: Responsive to board state changes
 *
 * @educational_features
 * - **Individual Constraints**: Separate row/column/box constraint visualization
 * - **Available Digits**: Final candidate set after constraint intersection
 * - **Conflict Analysis**: Visual indication of why digits are excluded
 * - **Interactive Selection**: Updates based on highlighted cell
 * - **Progressive Understanding**: Builds from individual constraints to final result
 *
 * @visual_hierarchy
 * ```
 * ┌─ Cell Header (Position + Context) ─┐
 * ├─ Row Constraints (9 digit states) ─┤
 * ├─ Column Constraints (9 digits) ────┤
 * ├─ Box Constraints (9 digits) ───────┤
 * └─ Final Candidates (intersection) ───┘
 * ```
 */

import React from 'react';
import type { Board, ConstraintUsage } from '../types/sudoku';
import { boxId } from '../lib/sudoku/board';

/**
 * Props interface for the ConstraintsPanel component
 *
 * @interface ConstraintsPanelProps
 * @property {ConstraintUsage|null} usage - Current constraint state (usage tables)
 * @property {Object|null} highlight - Currently highlighted cell position
 * @property {Board|undefined} board - Current board state for cell validation
 * @property {number[]|undefined} allowed - Pre-computed allowed digits (optional)
 */
interface ConstraintsPanelProps {
  usage: ConstraintUsage | null;
  highlight: { r: number; c: number } | null;
  board: Board | undefined;
  allowed: number[] | undefined;
}

// --- Sub-Components for Visualization ---

/**
 * Constraint Detail Row - Individual Constraint Type Visualization
 *
 * Displays the state of a single constraint type (row, column, or box) showing
 * which digits are used/forbidden and which are available for placement.
 * Provides color-coded visual feedback for constraint analysis.
 *
 * @component ConstraintDetailRow
 * @param {Object} props - Component properties
 * @param {string} props.label - Human-readable constraint type (Row/Column/Box)
 * @param {boolean[]} props.constraints - Usage array where true = digit is used
 * @param {string} props.color - CSS background color class for visual identification
 * @returns {JSX.Element} Row displaying constraint state for all 9 digits
 *
 * @visual_design
 * - **Available Digits**: White background with full opacity
 * - **Used Digits**: Gray background with reduced opacity
 * - **Color Indicator**: Dot showing constraint type color
 * - **Summary Count**: Shows X/9 available for quick assessment
 *
 * @educational_purpose
 * - Shows which digits are already used in the constraint
 * - Highlights available options for the constraint type
 * - Provides quick visual count of remaining possibilities
 * - Color-codes different constraint types for easy differentiation
 *
 * @example
 * ```tsx
 * <ConstraintDetailRow
 *   label="Row"
 *   constraints={[false, true, false, true, ...]} // 1-indexed boolean array
 *   color="bg-blue-500"
 * />
 * ```
 */
const ConstraintDetailRow = ({ label, constraints, color }: { label: string; constraints: boolean[]; color: string }) => {
  const digits = Array.from({ length: 9 }, (_, i) => i + 1);
  const availableDigits = digits.filter(d => !constraints[d]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`w-2 h-2 rounded-full ${color}`}></span>
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <span className="text-xs text-slate-500">({availableDigits.length}/9 available)</span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {digits.map(d => (
          <span 
            key={d} 
            className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-md transition-opacity duration-300 ${availableDigits.includes(d) ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'bg-slate-200/50 text-slate-400 opacity-70'}`}>
            {d}
          </span>
        ))}
      </div>
    </div>
  );
};

/**
 * Props interface for FinalDigitsVisualizer component
 *
 * @interface FinalDigitsVisualizerProps
 * @property {number[]} allowedDigits - Final set of allowed digits after constraint intersection
 * @property {Object} contextual - Individual constraint states for conflict analysis
 * @property {Object} contextual.row - Row constraint usage array
 * @property {Object} contextual.col - Column constraint usage array
 * @property {Object} contextual.box - Box constraint usage array
 */
interface FinalDigitsVisualizerProps {
  allowedDigits: number[];
  contextual: {
    row: { constraints: boolean[] };
    col: { constraints: boolean[] };
    box: { constraints: boolean[] };
  };
}

/**
 * Final Digits Visualizer - Constraint Intersection Analysis
 *
 * Advanced visualization component showing the final set of allowed digits
 * after intersecting all three constraint types (row, column, box). Provides
 * detailed conflict analysis for excluded digits.
 *
 * @component FinalDigitsVisualizer
 * @param {Object} props - Component properties
 * @param {number[]} props.allowedDigits - Digits that pass all constraints
 * @param {Object} props.contextual - Individual constraint states for analysis
 * @returns {JSX.Element} Grid of digits with conflict indicators
 *
 * @educational_features
 * - **Final Candidates**: Highlights digits available for placement
 * - **Conflict Analysis**: Shows which constraint(s) exclude each digit
 * - **Visual Indicators**: Color-coded dots for different constraint violations
 * - **Intersection Logic**: Demonstrates how multiple constraints interact
 *
 * @visual_design
 * - **Allowed Digits**: Green background with prominent display
 * - **Excluded Digits**: Gray background with conflict indicators
 * - **Conflict Dots**: Row (blue), Column (green), Box (purple)
 * - **Tooltip Information**: Hover text explaining conflict sources
 *
 * @constraint_logic
 * A digit is allowed if and only if:
 * - NOT used in the same row AND
 * - NOT used in the same column AND
 * - NOT used in the same 3x3 box
 *
 * @example
 * ```tsx
 * <FinalDigitsVisualizer
 *   allowedDigits={[3, 7, 9]}
 *   contextual={{
 *     row: { constraints: rowUsage },
 *     col: { constraints: colUsage },
 *     box: { constraints: boxUsage }
 *   }}
 * />
 * ```
 */
const FinalDigitsVisualizer: React.FC<FinalDigitsVisualizerProps> = ({ allowedDigits, contextual }) => {
  const digits = Array.from({ length: 9 }, (_, i) => i + 1);

  return (
    <div className="border-t border-slate-200 pt-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">✅</span>
        <span className="text-sm font-semibold text-slate-800">Final Allowed Digits</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {digits.map(d => {
          const isAllowed = allowedDigits.includes(d);
          const conflicts = {
            row: !isAllowed && contextual.row.constraints[d],
            col: !isAllowed && contextual.col.constraints[d],
            box: !isAllowed && contextual.box.constraints[d],
          };

          return (
            <div key={d} className="flex flex-col items-center gap-1">
              <span 
                className={`w-9 h-9 flex items-center justify-center text-sm font-bold rounded-lg transition-all duration-300 ${isAllowed ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-200 shadow-sm' : 'bg-slate-200/60 text-slate-400'}`}>
                {d}
              </span>
              <div className="flex gap-1 h-2">
                {isAllowed ? null : (
                  <>
                    {conflicts.row && <div className="w-2 h-2 rounded-full bg-blue-500" title="Row conflict"></div>}
                    {conflicts.col && <div className="w-2 h-2 rounded-full bg-emerald-500" title="Column conflict"></div>}
                    {conflicts.box && <div className="w-2 h-2 rounded-full bg-purple-500" title="Box conflict"></div>}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// --- Main Component ---

/**
 * Constraints Panel - Interactive Sudoku Constraint Analysis Interface
 *
 * Main component providing comprehensive constraint analysis for highlighted cells.
 * Displays individual constraint types (row, column, box) and computes final
 * allowed candidates through constraint intersection. Serves as an educational
 * tool for understanding Sudoku constraint logic.
 *
 * @component ConstraintsPanel
 * @param {Object} props - Component configuration and data
 * @param {ConstraintUsage|null} props.usage - Current constraint usage tables
 * @param {Object|null} props.highlight - Currently highlighted cell {r, c}
 * @param {Board|undefined} props.board - Current board state for validation
 * @param {number[]|undefined} props.allowed - Pre-computed allowed digits (optional)
 * @returns {JSX.Element} Complete constraint analysis interface
 *
 * @architecture
 * - **Contextual Display**: Shows constraints only for highlighted cell
 * - **Progressive Disclosure**: Builds from individual constraints to final result
 * - **Real-time Updates**: Responds immediately to cell selection changes
 * - **Educational Flow**: Teaches constraint intersection through visualization
 * - **Fallback States**: Graceful handling of no selection or loading states
 *
 * @constraint_analysis
 * 1. **Individual Constraints**: Shows row, column, and box usage separately
 * 2. **Intersection Logic**: Computes allowed digits as constraint intersection
 * 3. **Conflict Visualization**: Displays why specific digits are excluded
 * 4. **Educational Feedback**: Color-codes and annotates constraint violations
 *
 * @state_management
 * - Computes contextual constraints from usage tables and cell position
 * - Calculates allowed digits through constraint intersection algorithm
 * - Provides fallback computation when allowed digits not pre-computed
 * - Handles edge cases (no selection, filled cells, invalid states)
 *
 * @example
 * ```tsx
 * <ConstraintsPanel
 *   usage={constraintUsage}
 *   highlight={{ r: 3, c: 4 }}
 *   board={currentBoard}
 *   allowed={[2, 7, 9]}
 * />
 * ```
 *
 * @integration
 * - Used by SudokuVisualizer for constraint education
 * - Coordinates with BoardView for cell highlighting
 * - Receives data from useSolverStateImmer constraint calculations
 * - Supports timeline navigation through historical constraint states
 */
const ConstraintsPanel: React.FC<ConstraintsPanelProps> = ({ usage, highlight, board, allowed }) => {

  const getContextualConstraints = () => {
    if (!highlight || !usage) return null;
    const { r, c } = highlight;
    return {
      row: { index: r, constraints: usage.rows[r] },
      col: { index: c, constraints: usage.cols[c] },
      box: { index: boxId(r, c), constraints: usage.boxes[boxId(r, c)] }
    };
  };

  const computeAllowed = () => {
    if (!highlight || !board || !usage) return [] as number[];
    const { r, c } = highlight;
    if (board[r][c] !== '.') return [];
    const res: number[] = [];
    for (let d = 1; d <= 9; d++) if (!usage.rows[r][d] && !usage.cols[c][d] && !usage.boxes[boxId(r, c)][d]) res.push(d);
    return res;
  };

  const contextual = getContextualConstraints();
  const allowedDigits = (allowed && allowed.length) ? allowed : computeAllowed();

  // Loading state or default state when no cell is highlighted
  if (!usage || !contextual) {
    return (
      <div className="p-6 text-center flex flex-col justify-center items-center h-full">
        <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl opacity-40">🎯</span>
        </div>
        <div className="text-slate-500 text-sm font-medium">Select a cell</div>
        <div className="text-slate-400 text-xs mt-1">View its constraint details here</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xs">
            {contextual.row.index + 1},{contextual.col.index + 1}
          </span>
        </div>
        <div>
          <div className="font-semibold text-amber-900">Cell Constraint Analysis</div>
          <p className="text-xs text-amber-700">Row {contextual.row.index + 1} • Col {contextual.col.index + 1} • Box {contextual.box.index + 1}</p>
        </div>
      </div>

      {/* Constraint Details */}
      <div className="space-y-3">
        <ConstraintDetailRow label="Row" constraints={contextual.row.constraints} color="bg-blue-500" />
        <ConstraintDetailRow label="Column" constraints={contextual.col.constraints} color="bg-emerald-500" />
        <ConstraintDetailRow label="Box" constraints={contextual.box.constraints} color="bg-purple-500" />
      </div>

      {/* Final Allowed Digits Visualization */}
      <FinalDigitsVisualizer allowedDigits={allowedDigits} contextual={contextual} />
    </div>
  );
};

export default React.memo(ConstraintsPanel);
