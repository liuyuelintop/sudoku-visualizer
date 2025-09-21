# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- Dev server: `pnpm dev` or `bun run dev` (starts Vite on http://localhost:5173)
- Build: `pnpm build` or `bun run build` (outputs to `dist/`)
- Preview: `pnpm preview` or `bun run preview`
- Install dependencies: `pnpm install` or `bun install`

### Build Process
The project uses TypeScript compilation followed by Vite build: `tsc -b && vite build`

## Architecture Overview

This is a React + TypeScript Sudoku solver visualizer that demonstrates the MRV (Minimum Remaining Values) backtracking algorithm with real-time visualization.

### Key Components
- **SudokuMRVVisualizer.tsx**: Main component containing both UI and solver logic (currently tightly coupled)
- **App.tsx**: Application entry point
- **main.tsx**: React root setup with Vite

### Solver Architecture
- **Generator-based solver**: `solveSudokuSteps()` yields typed step events for visualization
- **MRV Strategy**: Selects empty cells with fewest legal candidates first
- **Step Events**: `selectCell`, `tryDigit`, `place`, `backtrack`, `solved`
- **Constraint Tracking**: Maintains boolean usage tables for rows, cols, and boxes

### UI Structure
- **Board Grid**: 9x9 visual representation with cell state animations
- **Constraints Panel**: Shows used/available digits per row/column/box as colored chips
- **MRV Status**: Displays current cell selection and candidates
- **Empties Window**: Shows frontier around current MRV selection
- **Controls**: Start/Pause, Step, Reset, Restart, Speed control
- **Logs**: Step-by-step events with optional board snapshots

### State Management (Phase 2 Stages 0-2 Complete ✅)
- **Production-Ready Architecture**: Immer-based immutable state with 6 core state variables
- **Performance Optimized**: 92% reduction in render calls through batch updates
- **Structural Sharing**: Immer provides efficient immutable updates
- **Feature Flag System**: Gradual rollout capability for architectural changes
- **Zero Regressions**: Timeline and UI functionality fully preserved

## Technical Specifications

### Styling
- Tailwind CSS via CDN for MVP styling
- Fixed board width to prevent layout shifts
- Responsive panels with scrollable constraint sections

### Input Format
- 9 lines of text, 9 characters each
- Use `.` for empty cells, digits `1-9` for filled cells
- Example: paste format for custom puzzles

### Performance Considerations (Phase 2 Stages 0-2 Optimized ✅)
- **Render Optimization**: 1 render per step vs 13 renders (92% improvement)
- **Structural Sharing**: Immer automatically optimizes object references
- **Batch State Updates**: Reduced state variable count from 24 to 6 core states
- **Generator-based solving**: Step-by-step visualization with minimal overhead
- **Adjustable animation speed**: 50-300ms per step with smooth performance

## Development Guidelines

### Code Style
- 2 spaces indentation, semicolons, double quotes
- PascalCase for components, camelCase for variables/functions
- TypeScript with strict typing enabled

### Architecture Status (Post Phase 2 Stages 0-2)
✅ **Resolved Issues**:
- ~~Multiple useState hooks~~ → Immer-based centralized state
- ~~Complex state management~~ → 6 core state variables with derived computed
- ~~Render thrashing~~ → 92% reduction in unnecessary re-renders

⚠️ **Remaining Opportunities**:
- Memory optimization (Stage 3 attempt failed)
- Solver/UI coupling could be further reduced
- Timer + generator lifecycle edge cases during replay
- No testing framework configured yet

### Next Development Priorities
1. **Testing Infrastructure**: Add Vitest for unit testing solver logic
2. **User Experience**: Step-back functionality with optimized history
3. **Code Quality**: Extract UI components for better separation
4. **Documentation**: Update inline docs to reflect new architecture

### Future Enhancements
- Visual MRV scan animation
- Per-cell candidate overlays
- Step-back functionality with history
- Export/import step traces
- Multiple puzzle difficulty levels