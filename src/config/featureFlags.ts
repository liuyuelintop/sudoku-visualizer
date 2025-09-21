/**
 * @fileoverview Feature Flag System - Runtime Configuration Management
 *
 * Dynamic feature toggle system for performance monitoring, debugging capabilities,
 * and experimental features. Provides type-safe feature flag checking and
 * comprehensive performance tracking utilities.
 *
 * @module config/featureFlags
 * @version 1.0.0
 * @since Phase-2-Architecture-Finalization
 *
 * @architecture
 * - Type-safe feature flag definitions with 'as const' assertions
 * - Runtime feature checking with compile-time type inference
 * - Performance tracking utilities with configurable verbosity
 * - Centralized feature state management
 *
 * @usage
 * ```typescript
 * import { FEATURE_FLAGS, isFeatureEnabled, PerformanceTracker } from './config/featureFlags';
 *
 * // Type-safe feature checking
 * if (isFeatureEnabled('ENABLE_PERFORMANCE_TRACKING')) {
 *   PerformanceTracker.trackRender('MyComponent');
 * }
 *
 * // Performance monitoring
 * PerformanceTracker.trackStateUpdate('useSudokuController', 'stepOnce');
 * const report = PerformanceTracker.getReport();
 * ```
 *
 * @performance
 * - Zero runtime overhead when flags are disabled
 * - Compile-time type checking prevents invalid flag names
 * - Minimal memory footprint for tracking data
 */

/**
 * Feature flag configuration object
 *
 * Central definition of all feature toggles available in the application.
 * All flags are type-safe and provide compile-time checking.
 *
 * @constant
 * @readonly
 */
export const FEATURE_FLAGS = {
  /** Enable comprehensive performance tracking and monitoring */
  ENABLE_PERFORMANCE_TRACKING: true,

  /** Enable verbose state update logging (warning: very verbose output) */
  LOG_STATE_UPDATES: false,
  /** Enable render count logging for component performance analysis */
  LOG_RENDER_COUNT: false,
} as const;

/**
 * Type-safe feature flag checker
 *
 * Provides runtime checking of feature flags with compile-time type safety.
 * TypeScript will enforce that only valid flag names can be passed.
 *
 * @param flag - The feature flag to check (must be a valid FEATURE_FLAGS key)
 * @returns The current state of the specified feature flag
 *
 * @example
 * ```typescript
 * if (isFeatureEnabled('ENABLE_PERFORMANCE_TRACKING')) {
 *   // This code only runs when performance tracking is enabled
 *   console.log('Performance tracking is active');
 * }
 *
 * // TypeScript error - invalid flag name:
 * // isFeatureEnabled('INVALID_FLAG'); // ❌ Compile error
 * ```
 */
export function isFeatureEnabled<K extends keyof typeof FEATURE_FLAGS>(
  flag: K
): typeof FEATURE_FLAGS[K] {
  return FEATURE_FLAGS[flag];
}

/**
 * Performance measurement and tracking utilities
 *
 * Provides comprehensive performance monitoring capabilities for React components
 * and state management hooks. Tracks render frequency, state update patterns,
 * and timing information for performance analysis.
 *
 * @namespace
 */
export const PerformanceTracker = {
  /** Total number of component renders tracked */
  renderCount: 0,
  /** Total number of state updates tracked */
  stateUpdateCount: 0,
  /** Timestamp of the last recorded update */
  lastUpdateTime: 0,

  /**
   * Track and log component render events
   *
   * @param componentName - Name of the component being rendered
   * @example
   * ```typescript
   * // In a React component
   * PerformanceTracker.trackRender('SudokuVisualizer');
   * ```
   */
  trackRender(componentName: string) {
    if (isFeatureEnabled('LOG_RENDER_COUNT')) {
      this.renderCount++;
      console.log(`🔄 Render #${this.renderCount}: ${componentName}`);
    }
  },

  /**
   * Track and log state update events with timing information
   *
   * @param hookName - Name of the hook managing the state
   * @param updateType - Type of update operation performed
   * @example
   * ```typescript
   * // In a custom hook
   * PerformanceTracker.trackStateUpdate('useSudokuController', 'stepOnce');
   * PerformanceTracker.trackStateUpdate('useSolverStateImmer', 'initializePuzzle');
   * ```
   */
  trackStateUpdate(hookName: string, updateType: string) {
    if (isFeatureEnabled('LOG_STATE_UPDATES')) {
      this.stateUpdateCount++;
      const now = performance.now();
      const timeSinceLastUpdate = now - this.lastUpdateTime;
      this.lastUpdateTime = now;
      console.log(`⚡ State Update #${this.stateUpdateCount}: ${hookName}.${updateType} (+${timeSinceLastUpdate.toFixed(2)}ms)`);
    }
  },

  /**
   * Reset all tracking counters and timestamps
   *
   * Useful for starting fresh performance measurement sessions
   * or clearing data between test runs.
   */
  reset() {
    this.renderCount = 0;
    this.stateUpdateCount = 0;
    this.lastUpdateTime = performance.now();
  },

  /**
   * Generate a comprehensive performance report
   *
   * @returns Object containing current performance metrics
   * @example
   * ```typescript
   * const report = PerformanceTracker.getReport();
   * console.log(`Renders: ${report.renderCount}, Updates: ${report.stateUpdateCount}`);
   * console.log(`Average time between updates: ${report.avgTimeBetweenUpdates}ms`);
   * ```
   */
  getReport() {
    return {
      renderCount: this.renderCount,
      stateUpdateCount: this.stateUpdateCount,
      avgTimeBetweenUpdates: this.lastUpdateTime / Math.max(this.stateUpdateCount, 1)
    };
  }
};