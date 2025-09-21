/**
 * @fileoverview Empties Panel - MRV Algorithm Visualization Component
 *
 * Visualizes the MRV (Minimum Remaining Values) algorithm execution with detailed
 * analysis of empty cell selection, candidate counts, and array scanning process.
 * Provides educational insight into the algorithm's decision-making process.
 *
 * @module components/EmptiesPanel
 * @version 1.0.0
 * @since Phase-2-Architecture-Finalization
 *
 * @architecture
 * - **MRV Visualization**: Shows empties array with current selection highlighting
 * - **Scan Process**: Step-by-step visualization of MRV scanning algorithm
 * - **Array Operations**: Visual representation of swapping and frontier management
 * - **Candidate Analysis**: Real-time candidate count display and comparison
 * - **Timeline Integration**: Supports both live and historical data display
 */

import React from "react";
import EmptiesArrayVisualizer from "./EmptiesArrayVisualizer"; // Import the new component

/**
 * Represents a single item in the MRV (Minimum Remaining Values) scan trace
 *
 * Used for visualizing the step-by-step process of the MRV algorithm as it
 * scans through empty cells to find the optimal next cell for placement.
 * Each scan item captures the state at a specific point in the scanning process.
 *
 * @interface MRVScanItem
 * @property {number} i - Index position in the empties array being scanned
 * @property {number} r - Row coordinate (0-8) of the cell being evaluated
 * @property {number} c - Column coordinate (0-8) of the cell being evaluated
 * @property {number} count - Number of valid candidates for this cell
 * @property {number} bestIndex - Index of the current best cell found so far
 * @property {number} bestCount - Candidate count of the current best cell
 *
 * @example
 * ```typescript
 * const scanItem: MRVScanItem = {
 *   i: 3,           // Scanning 4th cell in empties array
 *   r: 2, c: 5,     // Cell at row 2, column 5
 *   count: 2,       // This cell has 2 valid candidates
 *   bestIndex: 1,   // Best cell so far is at index 1
 *   bestCount: 3    // Best cell has 3 candidates (worse than current)
 * };
 * ```
 *
 * @usage_context
 * - **Algorithm Visualization**: Step-by-step MRV scanning process
 * - **Educational Display**: Understanding heuristic decision making
 * - **Performance Analysis**: Tracking scan efficiency and comparisons
 * - **Timeline Replay**: Historical algorithm execution playback
 */
export type MRVScanItem = { i: number; r: number; c: number; count: number; bestIndex: number; bestCount: number };

// --- Helper Components for Readability ---

/**
 * Renders a single row representing an empty cell in the MRV-ordered list
 *
 * Displays cell position, candidate count, and fill status with appropriate
 * visual styling. Supports highlighting for the currently selected cell in
 * the MRV algorithm execution.
 *
 * @component EmptyCellRow
 * @param {Object} props - Component properties
 * @param {number} props.idx - Zero-based index in the empties array
 * @param {Object} props.cell - Cell data object
 * @param {number} props.cell.r - Row coordinate (0-8)
 * @param {number} props.cell.c - Column coordinate (0-8)
 * @param {number} props.cell.count - Number of valid candidates
 * @param {boolean} props.cell.filled - Whether cell has been filled
 * @param {boolean} props.isCurrent - Whether this is the currently selected cell
 * @returns {JSX.Element} Styled row element with cell information
 *
 * @visual_design
 * - **Position Display**: 1-based coordinates with monospace styling
 * - **Candidate Count**: Color-coded badges (red=0, green=1, gray=multiple)
 * - **Current Selection**: Amber highlighting for active cell
 * - **Filled Status**: Checkmark indication with reduced opacity
 *
 * @performance
 * - Memoized to prevent unnecessary re-renders during array updates
 * - Efficient conditional styling with pre-computed class combinations
 *
 * @example
 * ```tsx
 * <EmptyCellRow
 *   idx={3}
 *   cell={{ r: 2, c: 5, count: 2, filled: false }}
 *   isCurrent={true}
 * />
 * ```
 */
const EmptyCellRow = React.memo(({
  idx, 
  cell, 
  isCurrent,
}: {
  idx: number;
  cell: { r: number; c: number; count: number; filled: boolean };
  isCurrent: boolean;
}) => {
  const baseClasses = "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 border";
  const colorClasses = isCurrent
    ? "bg-amber-50 border-amber-200"
    : cell.filled
    ? "bg-slate-50 border-slate-200 opacity-60"
    : "bg-white border-slate-200"; // Removed hover state

  return (
    <div 
      data-idx={idx}
      className={`${baseClasses} ${colorClasses}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 rounded-lg px-2 py-1 min-w-[3rem] text-center">#{idx + 1}</span>
        <span className="text-sm font-semibold text-slate-700">({cell.r + 1},{cell.c + 1})</span>
      </div>
      <div className="flex items-center gap-2">
        {cell.filled ? (
          <span className="text-xs font-semibold bg-slate-200 text-slate-600 px-2.5 py-1 rounded-lg">✓ Filled</span>
        ) : (
          <span className={[
            'text-xs font-semibold px-2.5 py-1 rounded-lg border',
            cell.count === 0 ? 'bg-rose-50 text-rose-700 border-rose-200'
            : cell.count === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-slate-50 text-slate-700 border-slate-200',
          ].join(' ')}>
            {cell.count} candidates
          </span>
        )}
      </div>
    </div>
  );
});

// --- Main Component ---

/**
 * MRV Algorithm Visualization Panel - Empty Cells Display and Analysis
 *
 * Comprehensive visualization component for the MRV (Minimum Remaining Values)
 * algorithm execution. Displays the empties array, scan operations, swap operations,
 * and frontier management with educational annotations and real-time updates.
 *
 * @component EmptiesPanel
 * @param {Object} props - Component configuration and data
 * @param {Array} props.empties - Array of empty cell objects with position and candidate data
 * @param {Object|null} props.highlight - Currently highlighted cell coordinates {r, c}
 * @param {number} props.index - Current frontier index in the empties array
 * @param {Array} [props.scan=[]] - MRV scan trace showing algorithm progression
 * @param {Object|null} [props.swap=null] - Current swap operation {k, best}
 * @param {number} [props.scanPos=-1] - Current position in scan operation
 * @param {boolean} [props.autoScroll=true] - Whether to auto-scroll to current cell
 * @param {boolean} [props.isTimelineMode=false] - Whether displaying historical data
 * @returns {JSX.Element} Complete MRV visualization panel
 *
 * @architecture
 * - **Array Visualizer**: Delegates complex array operations to EmptiesArrayVisualizer
 * - **Cell List**: Simplified scrollable list of empty cells with current highlighting
 * - **Auto-Scroll**: Smooth scrolling to keep current cell visible
 * - **Timeline Support**: Handles both live and historical data visualization
 *
 * @educational_features
 * - **MRV Order Display**: Shows cells sorted by candidate count
 * - **Frontier Indication**: Highlights current algorithm position
 * - **Scan Process**: Step-by-step visualization of cell evaluation
 * - **Array Operations**: Visual representation of swapping and reordering
 *
 * @performance_considerations
 * - Memoized child components prevent unnecessary re-renders
 * - Efficient scrolling with smooth behavior and nearest block positioning
 * - Conditional auto-scroll to reduce layout thrashing
 * - Virtual scrolling considerations for large empties arrays
 *
 * @example
 * ```tsx
 * <EmptiesPanel
 *   empties={[
 *     { r: 0, c: 1, count: 2, filled: false },
 *     { r: 2, c: 3, count: 1, filled: false }
 *   ]}
 *   highlight={{ r: 0, c: 1 }}
 *   index={0}
 *   scan={[{ i: 0, r: 0, c: 1, count: 2, bestIndex: 0, bestCount: 2 }]}
 *   swap={{ k: 1, best: 0 }}
 *   scanPos={0}
 * />
 * ```
 *
 * @integration
 * - Used by SudokuVisualizer as primary MRV visualization component
 * - Coordinates with BoardView for highlight synchronization
 * - Receives data from useSolverStateImmer for real-time updates
 * - Supports timeline navigation through useVisualization
 */
export default function EmptiesPanel({
  empties,
  highlight,
  index: frontierIndex,
  scan = [],
  swap = null,
  scanPos = -1,
  autoScroll = true,
  isTimelineMode = false,
}: {
  empties: Array<{ r: number; c: number; count: number; filled: boolean }>;
  highlight: { r: number; c: number } | null;
  index: number;
  scan?: MRVScanItem[];
  swap?: { k: number; best: number } | null;
  scanPos?: number;
  autoScroll?: boolean;
  isTimelineMode?: boolean;
}) {
  if (!empties || empties.length === 0) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="text-sm font-semibold text-slate-800 mb-2">Empty Cells</div>
        <div className="text-center py-6 text-slate-600 text-sm">All cells filled!</div>
      </div>
    );
  }

  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // --- Auto-Scrolling Effect ---
  React.useEffect(() => {
    if (!autoScroll || !containerRef.current) return;
    
    const targetElement = containerRef.current.querySelector(`[data-idx="${frontierIndex}"]`);
    if (targetElement) {
      targetElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [autoScroll, frontierIndex]);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-slate-800">MRV Order</div>
        <div className="text-xs bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 font-mono text-slate-700">
          {frontierIndex + 1} / {empties.length}
        </div>
      </div>
      
      {/* The new visualizer for the `empties` array and its operations */}
      <EmptiesArrayVisualizer
        empties={empties}
        scan={scan}
        swap={swap}
        scanPos={scanPos}
        frontierIndex={frontierIndex}
        isTimelineMode={isTimelineMode}
      />

      {/* Empties List (now simplified) */}
      <div ref={containerRef} className="space-y-2 max-h-96 overflow-auto pr-2">
        {empties.map((cell, idx) => (
          <EmptyCellRow 
            key={`${cell.r}-${cell.c}`}
            idx={idx}
            cell={cell}
            isCurrent={idx === frontierIndex}
          />
        ))}
      </div>
    </div>
  );
}