# Sudoku Visualizer – Production Ready

## Overview
Interactive visualization of MRV (Minimum Remaining Values) backtracking algorithm for Sudoku solving. Features real-time constraint analysis, timeline navigation, and comprehensive learning tools.

## Architecture
```
src/
├── lib/sudoku/           # Pure business logic
│   ├── board.ts         # Board utilities, constraints
│   ├── solver.ts        # MRV generator
│   ├── validation.ts    # Input validation
│   └── index.ts         # Public exports
├── hooks/               # State management
│   ├── useSolverState.ts      # Core solver state
│   ├── useVisualization.ts    # UI timers/animations
│   └── useSudokuController.ts # Orchestration
├── components/          # UI components
│   ├── SudokuVisualizer.tsx   # Main app
│   ├── BoardView.tsx          # Board rendering
│   ├── ConstraintsPanel.tsx   # Smart constraints
│   ├── TimelinePanel.tsx      # History navigation
│   └── EmptiesPanel.tsx       # MRV status
├── types/sudoku.ts      # TypeScript definitions
└── utils/formatting.ts # Helper utilities
```

## Run Locally
- bun: `bun install` then `bun run dev`
- pnpm: `pnpm install` then `pnpm dev`
- Build/preview: `bun run build && bun run preview`

## Features

### Core Controls
- **Start/Pause**: Toggle animation with Space key
- **Reset/Restart**: Restore initial puzzle for replay
- **Speed Control**: Configurable 50–1000ms per step
- **Sample Puzzles**: Built-in puzzles (Classic/Easy/Medium/Hard)
- **Custom Input**: Paste 9 lines using `.` for empty cells

### Learning Mode
Toggle advanced panels for educational exploration:

- **Smart Constraints Panel**:
  - **Overview**: Context-aware constraints for selected cell + global stats
  - **Detailed**: Complete rows/cols/boxes breakdown with digit chips
  - Progressive disclosure pattern for better UX

- **MRV Status**: Selected cell and candidate digits visualization
- **Empties Panel**: Windowed view of MRV frontier with candidate counts
- **MRV Scan Animation**: Step-by-step trace of minimum remaining values selection
- **Timeline Navigation**: Scrub through solver history with slider controls
- **Execution Logs**: Terminal-style logs with optional board snapshots

### Interaction
- **Keyboard Shortcuts**:
  - `Space`: Start/Pause
  - `←/→`: Timeline navigation
  - `Esc`: Return to live view
- **Timeline Review**: Navigate any step with Prev/Next/Live controls
- **Export/Import**: JSON trace files for sharing and analysis

## Algorithm
- **MRV (Minimum Remaining Values)**: Selects empty cells with fewest legal candidates first
- **Backtracking**: Systematic depth-first search with constraint propagation
- **Real-time Visualization**: All internal solver state exposed through typed events

## Technical Details
- **Clean Architecture**: Pure business logic separated from UI concerns
- **Type Safety**: Comprehensive TypeScript interfaces throughout
- **Performance**: Optimized rendering with proper React hook patterns
- **Validation**: Input validation with conflict detection and highlighting
- **Robust State Management**: Safe generator lifecycle with replay support

## Documentation

### Core Documentation
- **Architecture**: [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Comprehensive technical architecture and design patterns
- **Development History**: [`DEVELOPMENT_HISTORY.md`](./DEVELOPMENT_HISTORY.md) — Complete development timeline and evolution

### Project History
- **Archive**: [`archive/`](./archive/) — Historical documents and development artifacts
  - **Reviews**: [`archive/reviews/`](./archive/reviews/) — Development milestone reviews
  - **Legacy**: [`archive/legacy/`](./archive/legacy/) — Archived technical documents
  - **Planning**: [`archive/planning/`](./archive/planning/) — Design and planning documents
