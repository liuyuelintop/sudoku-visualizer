/**
 * @fileoverview Sudoku Visualizer - Main Application Orchestrator Component
 *
 * Root component orchestrating the complete Sudoku solver visualization experience.
 * Integrates state management, UI components, keyboard controls, and visual modes
 * into a cohesive educational and analytical interface.
 *
 * @module components/SudokuVisualizer
 * @version 1.0.0
 * @since Phase-2-Architecture-Finalization
 *
 * @architecture
 * - **Component Orchestration**: Coordinates BoardView, ControlsCard, EmptiesPanel, ConstraintsPanel
 * - **State Integration**: Unifies controller state with local UI preferences
 * - **Timeline Navigation**: Provides historical step browsing with snapshot viewing
 * - **Keyboard Shortcuts**: Space (start/pause), arrows (timeline), Esc (live view)
 * - **View Mode System**: Learning vs Expert modes with progressive disclosure
 *
 * @ui_organization
 * ```
 * ┌─ Header (Logo, Sample Selector, View Mode) ─┐
 * ├─ Main Grid ─────────────────────────────────┤
 * │  ┌─ Board ─┐  ┌─ Analysis Panel ─────────┐  │
 * │  │ 9x9 Grid│  │ • MRV Order             │  │
 * │  │ + Pulse │  │ • Constraints (Expert)  │  │
 * │  └─────────┘  │ • Metrics (Expert)      │  │
 * │  ┌─Controls─┐  │ • Logs (Expert)         │  │
 * │  │Speed+Btns│  └─────────────────────────┘  │
 * │  └─────────┘                               │
 * └─ Footer (Algorithm Info) ──────────────────┘
 * ```
 *
 * @state_management
 * - **Controller Integration**: Uses useSudokuController for complete state management
 * - **Display State Resolution**: Handles live vs timeline view with snapshot overlays
 * - **UI Preferences**: Local state for view modes, panel selection, animation settings
 * - **Keyboard State**: Global keyboard shortcuts with typing context awareness
 *
 * @timeline_features
 * - **Snapshot Navigation**: Browse solver history step-by-step
 * - **Live/Historical Toggle**: Switch between current state and historical snapshots
 * - **Frame Trace Analysis**: Build per-cell DFS step trace for current selection
 * - **MRV Data Resolution**: Accurately derive MRV panel data from historical snapshots
 *
 * @accessibility
 * - Keyboard navigation with Space, Arrow keys, Escape
 * - Context-aware shortcuts (disabled during text input)
 * - Visual indicators for validation errors
 * - Progressive disclosure based on user expertise level
 */

import { useRef, useEffect, useState } from 'react';
import { useSudokuController } from '../hooks/useSudokuController';
import BoardView from './BoardView';
import ConstraintsPanel from './ConstraintsPanel';
import EmptiesPanel from './EmptiesPanel';
import ControlsCard from './ControlsCard';
import PerformanceComparison from './PerformanceComparison';
import { isFeatureEnabled } from '../config/featureFlags';

/**
 * Main Sudoku visualizer component orchestrating the complete user experience
 *
 * Serves as the root component that coordinates all aspects of the Sudoku solver
 * visualization including board display, controls, analysis panels, and navigation.
 * Implements a sophisticated view mode system and timeline navigation features.
 *
 * @component
 * @returns JSX element containing the complete Sudoku visualizer interface
 *
 * @features
 * - **Multi-Mode Interface**: Learning mode (simplified) vs Expert mode (full features)
 * - **Timeline Navigation**: Browse solver history with keyboard shortcuts
 * - **State Resolution**: Seamlessly switch between live state and historical snapshots
 * - **Responsive Layout**: Adaptive grid layout for different screen sizes
 * - **Interactive Controls**: Speed adjustment, animation toggles, sample selection
 * - **Validation Feedback**: Real-time error highlighting and conflict visualization
 *
 * @keyboard_shortcuts
 * - **Space**: Toggle start/pause solver execution
 * - **Left Arrow**: Navigate to previous step in timeline
 * - **Right Arrow**: Navigate to next step in timeline
 * - **Escape**: Return to live view from timeline mode
 * - **Disabled during text input**: Shortcuts respect input focus context
 *
 * @view_modes
 * - **Learning Mode**: Simplified interface focusing on MRV visualization
 * - **Expert Mode**: Full interface with constraints, metrics, and detailed logs
 * - **Progressive Disclosure**: UI complexity scales with user expertise level
 *
 * @example
 * ```tsx
 * // Simple usage - component handles all state management internally
 * function App() {
 *   return <SudokuVisualizer />;
 * }
 * ```
 */
export default function SudokuVisualizer() {
  const controller = useSudokuController();

  // Get current display state (live or timeline view)
  const currentSnapshot = controller.viewIndex !== null ? controller.history[controller.viewIndex] : null;
  const displayBoard = currentSnapshot ? currentSnapshot.board : controller.board;
  const displayHighlight = currentSnapshot ? currentSnapshot.highlight : controller.highlight;
  const displayTrying = currentSnapshot ? currentSnapshot.trying : controller.trying;
  const displayCandidates = currentSnapshot ? currentSnapshot.candidates : controller.candidates;
  const displayEmpties = currentSnapshot ? currentSnapshot.empties : controller.emptiesView;
  const displayUsage = currentSnapshot ? currentSnapshot.usage : controller.usageView;

  // UI state from original
  // Defaults: keep per-cell count badges and hover digits overlay
  const [showCandidateCounts, setShowCandidateCounts] = useState(true);
  const [showCandidateDigits, setShowCandidateDigits] = useState(true);
  const [autoScrollMRV, setAutoScrollMRV] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activePanel, setActivePanel] = useState('mrv');
  const [viewMode, setViewMode] = useState('learning'); // simple, learning, expert

  // Effect to reset active panel when switching from expert to learning mode
  // to avoid being on an expert-only tab in learning mode.
  useEffect(() => {
    if (viewMode === 'learning' && (activePanel === 'constraints' || activePanel === 'metrics' || activePanel === 'logs')) {
      setActivePanel('mrv');
    }
  }, [viewMode, activePanel]);

  const [pulse, setPulse] = useState<{ r: number; c: number } | null>(null);

  // Build a per-frame DFS step trace for the current selected cell (r,c)
  const frameTrace = (() => {
    const r = displayHighlight?.r, c = displayHighlight?.c;
    if (r == null || c == null) return [] as string[];
    const hist = controller.history;
    const endIdx = controller.viewIndex != null ? controller.viewIndex : hist.length - 1;
    if (endIdx < 0) return [] as string[];
    // Find the most recent selectCell for this (r,c) at or before endIdx
    let start = -1;
    for (let i = endIdx; i >= 0; i--) {
      const s = hist[i];
      if (s.event === 'selectCell' && s.highlight && s.highlight.r === r && s.highlight.c === c) {
        start = i; break;
      }
      // Stop if we hit a different selectCell
      if (s.event === 'selectCell' && s.highlight && (s.highlight.r !== r || s.highlight.c !== c)) break;
    }
    if (start === -1) return [] as string[];
    const lines: string[] = [];
    for (let i = start; i <= endIdx; i++) {
      const s = hist[i];
      if (s.event === 'selectCell' && s.highlight && s.highlight.r === r && s.highlight.c === c) {
        lines.push(`selectCell (${r + 1},${c + 1})`);
      } else if (s.event === 'tryDigit' && s.trying && s.trying.r === r && s.trying.c === c) {
        lines.push(`try ${s.trying.d}`);
      } else if (s.event === 'place' && s.note) {
        const m = s.note.match(/Place\s+(\d+)/i);
        const d = m ? m[1] : '?';
        lines.push(`place ${d}`);
      } else if (s.event === 'backtrack' && s.note) {
        const m = s.note.match(/Backtrack\s+(\d+)/i);
        const d = m ? m[1] : '?';
        lines.push(`backtrack ${d}`);
      }
    }
    return lines;
  })();

  // Resolve latest selectCell snapshot to drive MRV panel accurately
  const lastSelect = (() => {
    const hist = controller.history;
    const end = controller.viewIndex != null ? controller.viewIndex : hist.length - 1;
    for (let i = end; i >= 0; i--) {
      const s = hist[i];
      if (s.event === 'selectCell') return s;
    }
    return null;
  })();
  const derivedK = (() => {
    if (!lastSelect || !Array.isArray(lastSelect.empties) || !lastSelect.highlight) return controller.mrvIndex;
    const kIdx = lastSelect.empties.findIndex(e => e.r === lastSelect.highlight!.r && e.c === lastSelect.highlight!.c);
    return kIdx >= 0 ? kIdx : controller.mrvIndex;
  })();
  const derivedCandidates = lastSelect ? lastSelect.candidates : displayCandidates;
  const derivedCoords = lastSelect?.highlight || displayHighlight || null;

  

  // Keyboard shortcuts: Space (start/pause), Left/Right (timeline prev/next), Esc (Live)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || (target?.getAttribute('contenteditable') === 'true');
      if (isTyping) return;

      // Space toggles start/pause
      if (e.code === 'Space') {
        e.preventDefault();
        if (controller.running) controller.onPause(); else controller.onStart();
        return;
      }
      // Left/Right navigate timeline
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        if (controller.history.length === 0) return;
        e.preventDefault();
        controller.onPause();
        const delta = e.code === 'ArrowLeft' ? -1 : 1;
        const curr = controller.viewIndex == null ? controller.history.length - 1 : controller.viewIndex;
        const next = Math.min(controller.history.length - 1, Math.max(0, curr + delta));
        controller.onViewSnapshot(next);
        return;
      }
      // Esc returns to Live
      if (e.code === 'Escape') {
        e.preventDefault();
        controller.onViewLive();
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [controller.running, controller.history.length, controller.viewIndex, controller.onStart, controller.onPause, controller.onViewSnapshot, controller.onViewLive]);


  type Trace = { version: 1; generatedAt: string; initial: any; history: any[] };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto grid gap-8">
        <header className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 grid grid-cols-3 gap-px">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-white rounded-sm opacity-90"></div>
                ))}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Sudoku Solver</h1>
              <p className="text-xs text-slate-500">MRV Backtracking Visualizer</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ViewModeControl viewMode={viewMode} setViewMode={setViewMode} />
            {controller.validation.issues.length > 0 && (
              <div className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                Validation: {controller.validation.issues.length} issue(s)
              </div>
            )}
            <select
              className="px-3 py-2 rounded-xl bg-white/80 text-slate-700 text-sm border border-slate-200"
              value={controller.sampleKey}
              onChange={(e) => controller.loadSample(e.target.value)}
              title="Load sample puzzle"
            >
              {controller.samples.map(s => (
                <option key={s.key} value={s.key}>{s.name}</option>
              ))}
            </select>
            <button onClick={controller.onPaste} className="px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200">
              📋 Paste Board
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-8">
          {/* Board */}
          <div className="flex flex-col items-center gap-4">
            

            <div className="inline-grid w-[max-content] relative">
              <BoardView
                board={displayBoard}
                highlight={displayHighlight}
                trying={displayTrying}
                showCandidateCounts={showCandidateCounts}
                showCandidateDigits={showCandidateDigits}
                conflictSet={controller.validation.conflictSet}
                pulse={pulse}
              />
              {controller.finished && (
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent rounded-3xl pointer-events-none animate-pulse" />
              )}
            </div>

            

            {/* Main Controls Card */}
            <ControlsCard 
              controller={controller}
              showAdvanced={showAdvanced}
              setShowAdvanced={setShowAdvanced}
              autoScrollMRV={autoScrollMRV}
              setAutoScrollMRV={setAutoScrollMRV}
              showCandidateCounts={showCandidateCounts}
              setShowCandidateCounts={setShowCandidateCounts}
              showCandidateDigits={showCandidateDigits}
              setShowCandidateDigits={setShowCandidateDigits}
              viewMode={viewMode}
            />
          </div>

          {/* Unified Analysis Panel */}
          <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/30 overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex items-center border-b border-slate-200 bg-slate-50/80">
              <TabButton name="MRV Order" id="mrv" activePanel={activePanel} setActivePanel={setActivePanel} />
              {viewMode === 'expert' && (
                <>
                  <TabButton name="Constraints" id="constraints" activePanel={activePanel} setActivePanel={setActivePanel} />
                </>
              )}
            </div>

            {/* Tab Content */}
            <div className="p-4 h-full">
              {activePanel === 'mrv' && (
                <EmptiesPanel
                  empties={displayEmpties}
                  highlight={derivedCoords}
                  index={derivedK}
                  scan={currentSnapshot ? (currentSnapshot.scan || []) : controller.mrvScan}
                  swap={currentSnapshot ? (currentSnapshot.swap || null) : controller.mrvSwap}
                  scanPos={currentSnapshot ? -1 : controller.mrvScanPos}
                  isTimelineMode={currentSnapshot !== null}
                  autoScroll={autoScrollMRV}
                />
              )}
              {activePanel === 'constraints' && viewMode === 'expert' && (
                <ConstraintsPanel usage={displayUsage} highlight={displayHighlight} board={displayBoard} allowed={displayCandidates} />
              )}
            </div>
          </div>
        </div>

        <footer className="backdrop-blur-sm bg-white/60 rounded-2xl p-4 border border-white/40 text-center">
          <p className="text-sm text-slate-600 font-medium">
            🧠 <strong>MRV Algorithm:</strong> Selects empty cells with the fewest legal candidates first
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Watch the backtracking visualization step-by-step • Built with React + TypeScript
          </p>
        </footer>
      </div>

      {/* Performance Comparison Tool */}
      {/* {isFeatureEnabled('ENABLE_PERFORMANCE_TRACKING') && (
        <PerformanceComparison />
      )} */}
    </div>
  );
}



const viewModes = [
  { id: 'learning', name: 'Learning' },
  { id: 'expert', name: 'Expert' },
];

function ViewModeControl({ viewMode, setViewMode }: { viewMode: string; setViewMode: (mode: string) => void; }) {
  return (
    <div className="flex items-center p-1 bg-slate-200/80 rounded-xl border border-slate-300/80">
      {viewModes.map(mode => (
        <button 
          key={mode.id}
          onClick={() => setViewMode(mode.id)}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === mode.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100/50'}`}>
          {mode.name}
        </button>
      ))}
    </div>
  );
}

// --- Tab Button Component --------------------------------------------------
function TabButton({ name, id, activePanel, setActivePanel }: { name: string; id: string; activePanel: string; setActivePanel: (id: string) => void; }) {
  const isActive = activePanel === id;
  return (
    <button
      onClick={() => setActivePanel(id)}
      className={`px-4 py-3 text-sm font-semibold transition-colors duration-200 outline-none ${isActive ? 'text-indigo-600 bg-white' : 'text-slate-600 hover:bg-slate-200/70'}`}>
      {name}
    </button>
  );
}