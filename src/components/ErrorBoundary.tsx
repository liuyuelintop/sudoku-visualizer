/**
 * @fileoverview Error Boundary - Application Error Handling Component
 *
 * React Error Boundary component providing graceful error handling and recovery
 * for the Sudoku solver application. Catches JavaScript errors anywhere in the
 * component tree and displays a user-friendly error interface with debugging information.
 *
 * @module components/ErrorBoundary
 * @version 1.0.0
 * @since Phase-2-Architecture-Finalization
 *
 * @architecture
 * - **Error Catching**: Intercepts JavaScript errors in component tree
 * - **Graceful Degradation**: Prevents app crashes with fallback UI
 * - **Error Reporting**: Logs detailed error information for debugging
 * - **User Recovery**: Provides options to reload or retry after errors
 * - **Developer Tools**: Technical details with stack traces for debugging
 *
 * @error_handling_strategy
 * 1. **Catch Errors**: Uses React's error boundary lifecycle methods
 * 2. **Log Details**: Console logging with full error context
 * 3. **Display Fallback**: User-friendly error UI with recovery options
 * 4. **Provide Actions**: Reload app or attempt to continue
 * 5. **Technical Info**: Collapsible developer information section
 *
 * @usage_patterns
 * - Wrap main application components for comprehensive coverage
 * - Use with custom fallback UI for specific component failures
 * - Integrate with error reporting services for production monitoring
 * - Provide contextual error messages for different error types
 */

import React, { ErrorInfo, ReactNode } from 'react';

/**
 * Internal state interface for Error Boundary component
 *
 * @interface ErrorBoundaryState
 * @property {boolean} hasError - Whether an error has been caught
 * @property {Error} [error] - The caught Error object
 * @property {ErrorInfo} [errorInfo] - React's error info with component stack
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Props interface for Error Boundary component
 *
 * @interface ErrorBoundaryProps
 * @property {ReactNode} children - Child components to wrap with error boundary
 * @property {ReactNode} [fallback] - Custom fallback UI to display on error
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Error Boundary Class Component - React Error Handling
 *
 * Robust error boundary implementation using React's error boundary lifecycle methods.
 * Provides comprehensive error catching, logging, and user-friendly recovery interface
 * for the Sudoku solver application.
 *
 * @class ErrorBoundary
 * @extends React.Component
 * @param {ErrorBoundaryProps} props - Component props with children and optional fallback
 * @param {ErrorBoundaryState} state - Internal state tracking error status and details
 *
 * @lifecycle_methods
 * - **constructor**: Initializes clean state
 * - **getDerivedStateFromError**: Static method to update state on error
 * - **componentDidCatch**: Logs error details and updates component state
 * - **render**: Returns fallback UI or children based on error state
 *
 * @error_recovery_features
 * - **Reload Application**: Full page refresh to reset state
 * - **Try Again**: Attempts to reset error boundary state
 * - **Technical Details**: Expandable error information for developers
 * - **User-Friendly Messages**: Clear explanation of error state
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <SudokuVisualizer />
 * </ErrorBoundary>
 * ```
 *
 * @production_considerations
 * - Integrate with error reporting services (Sentry, Bugsnag)
 * - Customize error messages based on error types
 * - Implement retry logic with exponential backoff
 * - Add user feedback collection for error reports
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Static lifecycle method to derive error state from caught errors
   *
   * Called when a descendant component throws an error during rendering.
   * Updates the component state to trigger error UI display.
   *
   * @static
   * @param {Error} error - The error that was thrown
   * @returns {ErrorBoundaryState} New state object with error flag set
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Lifecycle method for error handling and logging
   *
   * Called when a descendant component throws an error. Logs the error
   * details to console and updates component state with full error information.
   *
   * @param {Error} error - The error that was thrown
   * @param {ErrorInfo} errorInfo - React error info with component stack trace
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border border-red-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                !
              </div>
              <h1 className="text-xl font-semibold text-red-800">
                Application Error
              </h1>
            </div>

            <div className="space-y-4">
              <p className="text-red-700">
                Something went wrong while running the Sudoku solver. This is likely a bug in the application.
              </p>

              <details className="bg-red-50 rounded-lg p-4">
                <summary className="cursor-pointer font-medium text-red-800 mb-2">
                  Technical Details
                </summary>
                <div className="space-y-2">
                  <div>
                    <strong>Error:</strong>
                    <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                      {this.state.error?.message || 'Unknown error'}
                    </pre>
                  </div>
                  {this.state.error?.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>

              <div className="flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Reload Application
                </button>
                <button
                  onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;