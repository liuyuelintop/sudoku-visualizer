import SudokuVisualizer from './components/SudokuVisualizer';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <SudokuVisualizer />
    </ErrorBoundary>
  );
}

