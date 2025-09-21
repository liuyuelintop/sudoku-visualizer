/**
 * @fileoverview Empties Array Visualizer - MRV Algorithm Array Operations
 *
 * Specialized visualization component for the MRV algorithm's array-based operations.
 * Provides step-by-step animation of scanning, selection, and swapping operations
 * on the empties array with educational annotations and state transitions.
 *
 * @module components/EmptiesArrayVisualizer
 * @version 1.0.0
 * @since Phase-2-Architecture-Finalization
 *
 * @architecture
 * - **Array Visualization**: Visual representation of empties array state
 * - **Multi-phase Animation**: Scanning, highlighting, and swapping sequences
 * - **State Reconstruction**: Pre/post swap array state management
 * - **Educational Annotations**: Dynamic titles and tooltips explaining operations
 * - **Timeline Support**: Static display for historical state viewing
 *
 * @animation_phases
 * ```
 * idle → scanning → highlightingSwap → swapped → idle
 *   ↑                                              ↓
 *   └──────────────────────────────────────────────┘
 * ```
 *
 * @visualization_states
 * - **Idle**: Static array with frontier indicator
 * - **Scanning**: Moving pointer with best-so-far highlighting
 * - **Highlighting Swap**: Pre-swap emphasis on cells to be swapped
 * - **Swapped**: Post-swap state with success indicators
 *
 * @educational_features
 * - **Array Operations**: Visual representation of swapping mechanics
 * - **Frontier Management**: Clear indication of array frontier position
 * - **Scan Process**: Step-by-step MRV algorithm execution
 * - **Best Selection**: Highlighting of optimal cell discovery
 * - **Operation Sequence**: Logical progression through algorithm stages
 */

import React, { useState, useMemo, useEffect } from 'react';
import type { MRVScanItem } from '../types/sudoku';
import { ANIMATION_CONFIG } from '../config/constants';

// --- Types ---

/**
 * Props interface for the EmptiesArrayVisualizer component
 *
 * @interface EmptiesVisualizerProps
 * @property {Array} empties - Array of empty cell objects with position and candidate data
 * @property {MRVScanItem[]} scan - Trace of MRV scanning process steps
 * @property {number} scanPos - Current position in scan trace (-1 when complete)
 * @property {Object|null} swap - Swap operation details {k: frontierIndex, best: bestIndex}
 * @property {number} frontierIndex - Current frontier position in empties array
 * @property {boolean} [isTimelineMode] - Whether displaying historical data (no animations)
 */
type EmptiesVisualizerProps = {
  empties: Array<{ r: number; c: number; count: number; filled: boolean }>;
  scan: MRVScanItem[];
  scanPos: number;
  swap: { k: number; best: number } | null;
  frontierIndex: number;
  isTimelineMode?: boolean;
};

/**
 * Visualization phase enumeration for animation state machine
 *
 * @type VisualizationPhase
 * @description Controls the visual state and animation sequence
 * - **idle**: Static display with frontier indicator
 * - **scanning**: Active scan with moving pointer and best-so-far highlight
 * - **highlightingSwap**: Pre-swap state highlighting cells to be swapped
 * - **swapped**: Post-swap state showing completed operation
 */
type VisualizationPhase = 'idle' | 'scanning' | 'highlightingSwap' | 'swapped';

// --- Main Component ---

/**
 * Empties Array Visualizer - MRV Algorithm Array Operations Component
 *
 * Advanced visualization component providing detailed view of MRV algorithm's
 * array-based operations. Shows the empties array as it undergoes scanning,
 * selection, and swapping operations with full animation support.
 *
 * @component EmptiesArrayVisualizer
 * @param {Object} props - Component configuration and data
 * @param {Array} props.empties - Post-swap empties array (current state)
 * @param {MRVScanItem[]} props.scan - Complete scan trace for animation
 * @param {number} props.scanPos - Current scan position (-1 when complete)
 * @param {Object|null} props.swap - Swap operation {k: frontier, best: selected}
 * @param {number} props.frontierIndex - Current frontier position
 * @param {boolean} [props.isTimelineMode=false] - Timeline mode (no animations)
 * @returns {JSX.Element|null} Animated array visualization or null if empty
 *
 * @architecture
 * - **State Reconstruction**: Rebuilds pre-swap array for animation consistency
 * - **Phase Management**: Coordinates multi-stage animation sequence
 * - **Dynamic Rendering**: Selects appropriate array state for current phase
 * - **Educational Headers**: Context-aware titles and explanations
 * - **Timeline Support**: Static display mode for historical viewing
 *
 * @animation_sequence
 * 1. **Scanning Phase**: Shows pointer moving through array with best-so-far
 * 2. **Highlight Phase**: Emphasizes cells about to be swapped
 * 3. **Swapped Phase**: Shows final result with success indicators
 * 4. **Idle Phase**: Static state ready for next operation
 *
 * @visual_features
 * - **Cell Indicators**: Labels showing scan position, best selection, frontier
 * - **Color Coding**: Phase-appropriate backgrounds and text colors
 * - **Tooltips**: Detailed hover information with coordinates and status
 * - **Dynamic Headers**: Contextual titles explaining current operation
 * - **Smooth Transitions**: CSS-based animations between states
 *
 * @educational_value
 * - **Array Operations**: Visual demonstration of swapping mechanics
 * - **Algorithm Flow**: Step-by-step MRV decision process
 * - **Data Structure**: Understanding of frontier-based array management
 * - **Optimization**: Visual proof of minimum-cost selection strategy
 *
 * @example
 * ```tsx
 * <EmptiesArrayVisualizer
 *   empties={currentEmpties}
 *   scan={scanTrace}
 *   scanPos={2}
 *   swap={{ k: 0, best: 3 }}
 *   frontierIndex={0}
 *   isTimelineMode={false}
 * />
 * ```
 *
 * @performance_considerations
 * - Pre-swap array reconstruction memoized for efficiency
 * - Animation phases use setTimeout for controlled timing
 * - Timeline mode bypasses animations for instant display
 * - Color calculations cached per render cycle
 */
export default function EmptiesArrayVisualizer({
  empties: postSwapEmpties,
  scan,
  scanPos,
  swap,
  frontierIndex,
  isTimelineMode = false
}: EmptiesVisualizerProps) {

  // --- State Management ---
  const [phase, setPhase] = useState<VisualizationPhase>('idle');

  // Reconstruct the pre-swap array for visualization purposes.
  const preSwapEmpties = useMemo(() => {
    if (!swap) return postSwapEmpties; // If no swap, pre and post are the same.
    const temp = [...postSwapEmpties];
    // Reverse the swap to get the original state.
    [temp[swap.k], temp[swap.best]] = [temp[swap.best], temp[swap.k]];
    return temp;
  }, [postSwapEmpties, swap]);

  // The array to be rendered depends on the current visualization phase.
  const arrayToRender = phase === 'swapped' ? postSwapEmpties : preSwapEmpties;

  // --- Effects to control the 3-stage visualization ---
  useEffect(() => {
    // Timeline mode: show final static state, no animations
    if (isTimelineMode) {
      if (swap) {
        setPhase('swapped');
      } else if (scan.length > 0) {
        setPhase('idle'); // Show scan completed state
      } else {
        setPhase('idle');
      }
      return;
    }

    // Live mode: normal animation logic
    const isScanning = scanPos >= 0 && scanPos < scan.length;
    const scanJustFinished = scanPos === -1 && scan.length > 0;

    if (isScanning) {
      setPhase('scanning');
    } else if (scanJustFinished && swap) {
      // Scan finished, start the swap animation.
      setPhase('highlightingSwap');
      const timer = setTimeout(() => {
        setPhase('swapped');
      }, ANIMATION_CONFIG.SWAP_HIGHLIGHT_DURATION);
      return () => clearTimeout(timer);
    } else {
      setPhase('idle');
    }
  }, [scanPos, scan, swap, isTimelineMode]);

  // --- Dynamic Header (title + subtitle) ---
  const { title, subtitle } = useMemo(() => {
    // helpers
    const fmtIndex = (i?: number | null) =>
      typeof i === 'number' && i >= 0 ? `#${i + 1}` : '—';

    // Defaults
    let headerTitle = '`empties` array';
    let headerSubtitle = 'Hover on any cell to see its coordinates and candidate count.';

    switch (phase) {
      case 'scanning': {
        const total = scan.length;
        const step = scanPos >= 0 && scanPos < total ? scanPos + 1 : total > 0 ? total : 0;
        const cur = scan[scanPos];
        headerTitle = `Scanning empties (${step}/${total})`;
        headerSubtitle = cur
          ? `Pointer at ${fmtIndex(cur.i)}; best so far ${fmtIndex(cur.bestIndex)}.`
          : 'Advancing through cells to find the minimum remaining value.';
        break;
      }
      case 'highlightingSwap': {
        headerTitle = 'Best cell found';
        headerSubtitle = swap
          ? `Preparing to swap frontier ${fmtIndex(swap.k)} with best ${fmtIndex(swap.best)}.`
          : 'Preparing to swap the best cell into the frontier.';
        break;
      }
      case 'swapped': {
        headerTitle = 'Swap complete';
        headerSubtitle = swap
          ? `Best moved into frontier at ${fmtIndex(swap.k)}; previous frontier cell swapped out.`
          : 'Frontier updated with the best cell.';
        break;
      }
      case 'idle':
      default: {
        headerTitle = 'Ready to scan empties';
        headerSubtitle = `Frontier at ${fmtIndex(frontierIndex)}. Start the MRV scan to select the next cell.`;
        break;
      }
    }

    return { title: headerTitle, subtitle: headerSubtitle };
  }, [phase, scan, scanPos, swap, frontierIndex]);

  if (!arrayToRender.length) return null;

  // --- Render Logic ---
  return (
    <div className="p-3 mb-2 rounded-lg bg-slate-50 border border-slate-200">
      {/* Dynamic Title & Subtitle */}
      <div className="mb-2">
        <div className="text-xs font-semibold text-slate-800">{title}</div>
        <div className="text-[11px] text-slate-500">{subtitle}</div>
      </div>

      <div className="flex flex-row flex-wrap gap-1">
        {arrayToRender.map((cell, index) => {
          let indicator = '';
          let bgColor = 'bg-slate-100';
          let textColor = 'text-slate-600';
          let borderColor = 'border-slate-300';
          let bubbleTitle = `Index: ${index + 1}\nCoords: (${cell.r + 1}, ${cell.c + 1})\nCount: ${cell.count}`;

          // Determine styling based on the current phase
          switch (phase) {
            case 'scanning': {
              const currentScanItem = scan[scanPos];
              if (!currentScanItem) break;

              const isFinalScanStep = scanPos === scan.length - 1;

              if (isFinalScanStep) {
                // The scan has just finished. Highlight the single best cell.
                const finalBestIndex = scan[scan.length - 1].bestIndex;
                if (index === finalBestIndex) {
                  indicator = 'SELECT';
                  bgColor = 'bg-purple-300';
                  textColor = 'text-purple-900';
                  bubbleTitle += '\nStatus: Selected by MRV Scan';
                }
              } else {
                // The scan is in progress. Show the moving pointer and best-so-far.
                const bestIndexSoFar = currentScanItem.bestIndex;
                if (index === currentScanItem.i) {
                  indicator = 'SCAN';
                  bgColor = 'bg-amber-300';
                  bubbleTitle += '\nStatus: Being Scanned';
                } else if (index === bestIndexSoFar) {
                  bgColor = 'bg-emerald-200';
                  bubbleTitle += '\nStatus: Best so far';
                }
              }
              break;
            }
            case 'highlightingSwap': {
              if (swap && index === swap.k) {
                bgColor = 'bg-blue-300';
                bubbleTitle += '\nStatus: About to be swapped out';
              } else if (swap && index === swap.best) {
                bgColor = 'bg-blue-300';
                bubbleTitle += '\nStatus: Best cell, about to be swapped in';
              }
              break;
            }
            case 'swapped': {
              if (swap && index === swap.k) {
                indicator = '🏆 BEST';
                bgColor = 'bg-emerald-300';
                textColor = 'text-emerald-900';
                bubbleTitle += '\nStatus: Swapped into frontier';
              } else if (swap && index === swap.best) {
                indicator = 'SWAPPED';
                bgColor = 'bg-neutral-300';
                bubbleTitle += '\nStatus: Swapped out from frontier';
              }
              break;
            }
            case 'idle':
            default:
              if (index === frontierIndex) {
                indicator = `F${index + 1}`;
                bgColor = 'bg-blue-50';
                borderColor = 'border-blue-200';
                textColor = 'text-blue-800';
                bubbleTitle += '\nStatus: Frontier';
              }
              break;
          }

          return (
            <div
              key={`${index}-${cell.r}-${cell.c}`}
              title={bubbleTitle}
              className={`relative flex-grow min-w-[60px] h-16 rounded-md border p-1 flex flex-col items-center justify-center transition-all duration-300 ${bgColor} ${borderColor} ${textColor}`}>
              <div className="absolute top-0.5 right-1 text-[9px] font-bold opacity-80">{indicator}</div>
              <div className="font-mono text-xs">({cell.r + 1},{cell.c + 1})</div>
              <div className="font-bold text-sm">{cell.count}</div>
              <div className="absolute bottom-0.5 text-[9px] font-mono opacity-70">#{index + 1}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
