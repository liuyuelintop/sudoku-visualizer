/**
 * @fileoverview Controls Card - Main Solver Control Interface Component
 *
 * Comprehensive control panel providing solver execution controls, speed adjustment,
 * performance metrics, timeline navigation, and configuration options. Serves as
 * the primary user interface for interacting with the Sudoku solver.
 *
 * @module components/ControlsCard
 * @version 1.0.0
 * @since Phase-2-Architecture-Finalization
 *
 * @architecture
 * - **Control Interface**: Start, pause, step, reset operations with validation
 * - **Metrics Display**: Real-time performance metrics with sparkline visualization
 * - **Timeline Navigation**: History browsing with progress indicator
 * - **Configuration Panel**: Speed, logging, and visualization settings
 * - **Narrative Feedback**: Contextual messages and completion notifications
 *
 * @ui_organization
 * ```
 * ┌─ Primary Controls (Start/Pause/Step/Reset) ─┐
 * ├─ Speed Control (50-300ms slider) ──────────┤
 * ├─ Metrics (Steps/Backtracks/Efficiency) ────┤
 * ├─ Timeline (History navigation) ─────────────┤
 * ├─ Advanced Settings (Toggle panel) ─────────┤
 * └─ Configuration (Logging/Animation options) ┘
 * ```
 */

import React, { useState, useEffect } from 'react';
import Sparkline from './Sparkline';
import type {
  ControlsCardProps,
  MetricItemProps,
  NarrativeMetricsProps,
  CopyLogButtonProps
} from '../types/sudoku';

// --- Narrative Metrics Component (New) ---

/**
 * Narrative Metrics Component - Real-time Algorithm Performance Display
 *
 * Provides contextual, animated feedback about the solver's performance with
 * narrative annotations for key events (backtracks, completion). Includes
 * sparkline visualization for performance trends over time.
 *
 * @component NarrativeMetrics
 * @param {Object} props - Component properties
 * @param {Object} props.controller - Controller object with metrics and history
 * @returns {JSX.Element} Metrics display with sparklines and annotations
 *
 * @features
 * - **Real-time Metrics**: Steps, nodes, backtracks with trend visualization
 * - **Contextual Annotations**: Dynamic messages for significant events
 * - **Sparkline Integration**: Visual performance trends over time
 * - **Event-driven Updates**: Responsive to algorithm state changes
 * - **Auto-clearing Messages**: Temporary notifications with timed cleanup
 *
 * @educational_value
 * - Shows algorithm efficiency through metrics comparison
 * - Provides immediate feedback on backtracking events
 * - Celebrates successful completion with final scores
 * - Helps users understand performance patterns
 *
 * @example
 * ```tsx
 * <NarrativeMetrics controller={sudokuController} />
 * ```
 */
const NarrativeMetrics: React.FC<NarrativeMetricsProps> = ({ controller }) => {
  const [annotation, setAnnotation] = useState('');
  const [annotationKey, setAnnotationKey] = useState(0);

  useEffect(() => {
    if (!controller || controller.history.length === 0) return;

    const lastEvent = controller.history[controller.history.length - 1];
    let message = '';

    if (controller.finished) {
      const { steps, backtracks } = controller.metrics;

      // Check if puzzle was actually solved or has no solution
      if (lastEvent.note === 'No solution') {
        message = `No solution found! Explored ${steps} steps, ${backtracks} backtracks.`;
      } else {
        message = `Solved! Final score: ${steps} steps, ${backtracks} backtracks.`;
      }
    } else if (lastEvent.event === 'backtrack') {
      message = `Backtrack! Undoing step ${lastEvent.idx}. Total backtracks: ${controller.metrics.backtracks}`;
    }

    if (message) {
      setAnnotation(message);
      setAnnotationKey(k => k + 1); // Reset animation

      // Don't auto-clear the final "Solved!" message
      if (!controller.finished) {
        const timer = setTimeout(() => {
          setAnnotation('');
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [controller.history, controller.finished, controller.metrics]);

  /**
   * Individual Metric Display Component with Sparkline
   *
   * Renders a single performance metric with label, current value, color indicator,
   * and sparkline trend visualization. Provides compact, information-dense display
   * optimized for real-time performance monitoring.
   *
   * @component MetricItem
   * @param {Object} props - Metric display properties
   * @param {string} props.label - Human-readable metric name
   * @param {number} props.value - Current metric value
   * @param {number[]} props.history - Historical values for sparkline
   * @param {string} props.color - CSS color for indicator and sparkline
   * @returns {JSX.Element} Formatted metric row with sparkline
   *
   * @visual_design
   * - Color-coded indicator dot for quick metric identification
   * - Sparkline showing trend over time with matching color
   * - Right-aligned value for easy scanning
   * - Compact layout optimized for multiple metrics
   *
   * @example
   * ```tsx
   * <MetricItem
   *   label="Steps"
   *   value={42}
   *   history={[35, 38, 40, 42]}
   *   color="#6366f1"
   * />
   * ```
   */
  const MetricItem: React.FC<MetricItemProps> = ({ label, value, history, color }) => (
    <div className="flex items-center justify-between gap-4 p-2 bg-white/50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${color}`}></span>
        <span className="text-xs text-slate-600 font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <Sparkline data={history} color={color} width={60} height={16} />
        <span className="text-sm font-bold text-slate-800 w-12 text-right">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="mt-3 space-y-2 p-3 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg border border-slate-200/50">
      <div className="space-y-1.5">
        <MetricItem label="Steps" value={controller.metrics.steps} history={controller.stepsHistory} color="#6366f1" />
        <MetricItem label="Nodes" value={controller.metrics.nodes} history={controller.nodesHistory} color="#10b981" />
        <MetricItem label="Backtracks" value={controller.metrics.backtracks} history={controller.backtracksHistory} color="#ef4444" />
      </div>
      {annotation && (
        <div key={annotationKey} className="mt-2 p-2 text-center text-xs font-medium text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-lg animate-fade-in">
          {annotation}
        </div>
      )}
    </div>
  );
};


/**
 * Copy Log Button Component - Clipboard Export Functionality
 *
 * Provides one-click export of solver logs to clipboard with visual feedback.
 * Handles async clipboard operations with proper error handling and state management.
 *
 * @component CopyLogButton
 * @param {Object} props - Component properties
 * @param {Object} props.controller - Controller object containing logs array
 * @returns {JSX.Element} Button with copy functionality and status feedback
 *
 * @features
 * - **One-click Export**: Copies entire log history to system clipboard
 * - **Visual Feedback**: Button state changes to confirm successful copy
 * - **Error Handling**: Graceful fallback for clipboard access failures
 * - **Debouncing**: Prevents multiple rapid copy attempts
 * - **Auto-reset**: Returns to idle state after confirmation display
 *
 * @accessibility
 * - Clear visual indicators for copy state
 * - Disabled state during operation to prevent confusion
 * - Descriptive text for screen readers
 *
 * @example
 * ```tsx
 * <CopyLogButton controller={sudokuController} />
 * ```
 */
const CopyLogButton: React.FC<CopyLogButtonProps> = ({ controller }) => {
  const [copyState, setCopyState] = useState('idle');

  const handleCopy = () => {
    if (copyState !== 'idle') return;

    navigator.clipboard.writeText(controller.logs.join('\n')).then(() => {
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    }).catch(err => {
      console.error('Failed to copy log:', err);
    });
  };

  return (
    <button 
      onClick={handleCopy}
      disabled={copyState !== 'idle'}
      className="group w-full flex items-center justify-center gap-3 p-2.5 rounded-md bg-white/80 border border-slate-200/50 hover:bg-white hover:shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-70">
        <div className="flex items-center gap-2">
            <span className="text-sm">{copyState === 'idle' ? '📋' : '✅'}</span>
            <span className="text-xs font-medium text-slate-700">
              {copyState === 'idle' ? 'Copy Log to Clipboard' : 'Copied!'}
            </span>
        </div>
    </button>
  );
}


/**
 * Main Controls Card Component - Primary Solver Interface
 *
 * Comprehensive control panel orchestrating all solver operations, timeline navigation,
 * performance monitoring, and configuration options. Serves as the central hub for
 * user interaction with the Sudoku solver visualization system.
 *
 * @component ControlsCard
 * @param {Object} props - Component configuration and callbacks
 * @param {Object} props.controller - Main solver controller with methods and state
 * @param {boolean} props.showAdvanced - Whether advanced options panel is expanded
 * @param {Function} props.setShowAdvanced - Toggle advanced options visibility
 * @param {boolean} props.autoScrollMRV - Auto-scroll MRV panel setting
 * @param {Function} props.setAutoScrollMRV - Toggle MRV auto-scroll
 * @param {boolean} props.showCandidateCounts - Show candidate count badges
 * @param {Function} props.setShowCandidateCounts - Toggle candidate count display
 * @param {boolean} props.showCandidateDigits - Show candidate digit overlays
 * @param {Function} props.setShowCandidateDigits - Toggle candidate digit display
 * @param {string} props.viewMode - Current view mode ('learning', 'expert', etc.)
 * @returns {JSX.Element} Complete control interface
 *
 * @architecture
 * - **Primary Controls**: Start/pause/step/reset with visual feedback
 * - **Speed Control**: Adjustable animation timing with gradient slider
 * - **Timeline Navigation**: Historical state browsing with progress indicator
 * - **Advanced Options**: Progressive disclosure for expert features
 * - **Performance Metrics**: Real-time algorithm performance with sparklines
 * - **Configuration Panel**: Visualization and logging options
 *
 * @interaction_patterns
 * - **Modal Operation**: Prevents conflicting actions during solver execution
 * - **Progressive Disclosure**: Advanced options hidden by default
 * - **Visual Feedback**: Immediate response to all user interactions
 * - **Keyboard Support**: Timeline navigation with arrow keys
 * - **State Persistence**: Settings maintained across solver sessions
 *
 * @example
 * ```tsx
 * <ControlsCard
 *   controller={sudokuController}
 *   showAdvanced={false}
 *   setShowAdvanced={setShowAdvanced}
 *   autoScrollMRV={true}
 *   setAutoScrollMRV={setAutoScrollMRV}
 *   showCandidateCounts={true}
 *   setShowCandidateCounts={setShowCandidateCounts}
 *   showCandidateDigits={true}
 *   setShowCandidateDigits={setShowCandidateDigits}
 *   viewMode="learning"
 * />
 * ```
 */
export default function ControlsCard({ controller, showAdvanced, setShowAdvanced, autoScrollMRV, setAutoScrollMRV, showCandidateCounts, setShowCandidateCounts, showCandidateDigits, setShowCandidateDigits, viewMode }: ControlsCardProps) {

  return (
    <div className="bg-white rounded-xl p-5 shadow-lg border border-slate-200/50 w-full max-w-md backdrop-blur-sm">
      {/* --- Main Playback Controls --- */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button
          title="Reset to initial board"
          onClick={controller.onReset}
          className="group relative p-3 rounded-xl bg-gradient-to-b from-slate-100 to-slate-200 text-slate-700 font-medium shadow-sm hover:shadow-md hover:from-slate-200 hover:to-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-out"
          disabled={controller.running}>
          <span className="text-xl group-hover:scale-110 transition-transform duration-200">🔄</span>
        </button>

        {!controller.running ? (
          <button
            onClick={controller.onStart}
            disabled={controller.finished}
            className="group flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-emerald-700 disabled:from-emerald-300 disabled:to-emerald-400 disabled:cursor-not-allowed transition-all duration-200 ease-out transform hover:scale-105 active:scale-95">
            <span className="text-lg group-hover:translate-x-0.5 transition-transform duration-200">▶</span>
            <span>Start</span>
          </button>
        ) : (
          <button
            onClick={controller.onPause}
            className="group flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold shadow-md hover:shadow-lg hover:from-rose-600 hover:to-rose-700 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95">
            <span className="text-lg">⏸</span>
            <span>Pause</span>
          </button>
        )}

        <button
          title="Advance solver by one step (Live only)"
          onClick={controller.onStep}
          disabled={controller.running || controller.finished || controller.viewIndex !== null}
          className="group flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl bg-gradient-to-b from-slate-100 to-slate-200 text-slate-700 font-medium shadow-sm hover:shadow-md hover:from-slate-200 hover:to-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-out">
          <span className="text-lg font-bold group-hover:scale-110 transition-transform duration-200">+1</span>
          <span className="text-xs">Step</span>
        </button>
      </div>

      {/* --- Compact Speed Control --- */}
      <div className="flex items-center gap-3 mb-4 px-2">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-lg">⚡</span>
          <span className="text-sm font-medium text-slate-700">Speed</span>
        </div>
        <div className="flex-1 relative">
          <input
            className="w-full h-2.5 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full appearance-none cursor-pointer"
            type="range"
            min={50}
            max={1000}
            step={50}
            value={controller.speed}
            onChange={(e) => controller.setSpeed(parseInt(e.target.value))}
            style={{
              background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((1000 - controller.speed) / 950) * 100}%, #e2e8f0 ${((1000 - controller.speed) / 950) * 100}%, #e2e8f0 100%)`
            }}
          />
        </div>
        <span className="text-xs font-mono bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 px-2 py-1 rounded-md text-amber-700 flex-shrink-0">
          {controller.speed}ms
        </span>
      </div>

      {/* --- Compact Timeline Section --- */}
      {controller.history.length > 0 && (
        <div className="border-t border-slate-200/60 pt-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">📊</span>
              <label className="text-sm font-semibold text-slate-800">Timeline</label>
            </div>
            <span className="text-xs font-mono bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 px-2.5 py-1 rounded-md text-blue-700">
              Step {controller.viewIndex !== null ? controller.viewIndex + 1 : controller.history.length} / {controller.history.length}
            </span>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <input
                className="w-full h-2.5 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full appearance-none cursor-pointer disabled:bg-slate-100"
                type="range"
                min={0}
                max={controller.history.length - 1}
                value={controller.viewIndex ?? controller.history.length - 1}
                onChange={(e) => controller.onViewSnapshot(parseInt(e.target.value))}
                disabled={controller.running}
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((controller.viewIndex ?? controller.history.length - 1) / Math.max(controller.history.length - 1, 1)) * 100}%, #e2e8f0 ${((controller.viewIndex ?? controller.history.length - 1) / Math.max(controller.history.length - 1, 1)) * 100}%, #e2e8f0 100%)`
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                title="Step Back (Left Arrow)"
                onClick={() => {
                  const currentIndex = controller.viewIndex ?? (controller.history.length - 1);
                  if (currentIndex > 0) controller.onViewSnapshot(currentIndex - 1);
                }}
                disabled={controller.running || controller.history.length === 0 || controller.viewIndex === 0}
                className="group flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-b from-slate-100 to-slate-200 text-slate-700 font-medium shadow-sm hover:shadow-md hover:from-slate-200 hover:to-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                <span className="text-sm group-hover:-translate-x-0.5 transition-transform duration-200">←</span>
                <span className="text-xs">Prev</span>
              </button>

              <button
                title="Go to Live View"
                onClick={controller.onViewLive}
                disabled={controller.running || controller.viewIndex === null}
                className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-sm hover:shadow-md hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                <span className="text-xs">Live</span>
              </button>

              <button
                title="Step Forward (Right Arrow)"
                onClick={() => {
                  if (controller.viewIndex !== null) controller.onViewSnapshot(controller.viewIndex + 1);
                }}
                disabled={controller.running || controller.viewIndex === null || controller.viewIndex >= controller.history.length - 1}
                className="group flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-b from-slate-100 to-slate-200 text-slate-700 font-medium shadow-sm hover:shadow-md hover:from-slate-200 hover:to-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                <span className="text-xs">Next</span>
                <span className="text-sm group-hover:translate-x-0.5 transition-transform duration-200">→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Advanced Options (Progressive Disclosure) --- */}
      {(viewMode === 'learning' || viewMode === 'expert') && (
        <div className="border-t border-slate-200/60 pt-4">
          <button
            className="group w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200/50 text-slate-700 font-medium hover:from-slate-100 hover:to-slate-200 hover:shadow-sm transition-all duration-200"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <span className="text-sm">🛠️</span>
            <span className="text-sm">{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
            <span className={`text-xs transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {showAdvanced && (
            <>
              <NarrativeMetrics controller={controller} />
              <div className="mt-3 space-y-2">
                <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg border border-slate-200/50 space-y-2">
                  <label className="group flex items-center gap-3 p-2.5 rounded-md bg-white/80 border border-slate-200/50 hover:bg-white hover:shadow-sm transition-all duration-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={controller.logBoards}
                      onChange={(e) => controller.setLogBoards(e.target.checked)}
                      className="w-4 h-4 rounded border-2 border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📸</span>
                      <span className="text-xs font-medium text-slate-700">Board Snapshots</span>
                    </div>
                  </label>

                  <label className="group flex items-center gap-3 p-2.5 rounded-md bg-white/80 border border-slate-200/50 hover:bg-white hover:shadow-sm transition-all duration-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCandidateCounts}
                      onChange={(e) => setShowCandidateCounts(e.target.checked)}
                      className="w-4 h-4 rounded border-2 border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🔢</span>
                      <span className="text-xs font-medium text-slate-700">Candidate Counts</span>
                    </div>
                  </label>

                  <label className="group flex items-center gap-3 p-2.5 rounded-md bg-white/80 border border-slate-200/50 hover:bg-white hover:shadow-sm transition-all duration-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCandidateDigits}
                      onChange={(e) => setShowCandidateDigits(e.target.checked)}
                      className="w-4 h-4 rounded border-2 border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm">👁️</span>
                      <span className="text-xs font-medium text-slate-700">Candidate Digits (hover)</span>
                    </div>
                  </label>

                  <label className="group flex items-center gap-3 p-2.5 rounded-md bg-white/80 border border-slate-200/50 hover:bg-white hover:shadow-sm transition-all duration-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoScrollMRV}
                      onChange={(e) => setAutoScrollMRV(e.target.checked)}
                      className="w-4 h-4 rounded border-2 border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🎯</span>
                      <span className="text-xs font-medium text-slate-700">Auto-scroll MRV</span>
                    </div>
                  </label>
                </div>
                <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg border border-slate-200/50">
                    <CopyLogButton controller={controller} />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
