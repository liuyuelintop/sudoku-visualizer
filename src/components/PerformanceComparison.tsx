/**
 * @fileoverview Performance Comparison Tool - A/B Testing and Optimization Analysis
 *
 * Interactive development tool for comparing performance characteristics across
 * different implementation strategies. Provides real-time metrics collection,
 * analysis, and visualization for optimization decisions.
 *
 * @module components/PerformanceComparison
 * @version 1.0.0
 * @since Phase-2-Architecture-Finalization
 *
 * @architecture
 * - **Metrics Collection**: Real-time performance data gathering
 * - **Implementation Comparison**: A/B testing between optimization strategies
 * - **Live Monitoring**: Recording and stop/start controls
 * - **Analysis Dashboard**: Formatted metrics with improvement calculations
 * - **Developer Tools**: Feature flag integration and optimization guidance
 *
 * @performance_metrics
 * - **Render Count**: Number of component re-renders during test period
 * - **State Updates**: Count of state mutations and updates
 * - **Memory Usage**: JavaScript heap size consumption (Chrome only)
 * - **Update Latency**: Average time between state updates
 * - **Timestamp**: Recording time for temporal analysis
 *
 * @optimization_strategy
 * ```
 * ┌─ Baseline Measurement ─┐
 * ├─ Implementation A Test ─┤
 * ├─ Implementation B Test ─┤
 * ├─ Comparative Analysis ──┤
 * └─ Optimization Decision ──┘
 * ```
 *
 * @development_workflow
 * 1. **Start Recording**: Begin metrics collection
 * 2. **Run Test Scenario**: Execute solver with typical workload
 * 3. **Stop Recording**: Capture metrics snapshot
 * 4. **Switch Implementation**: Modify feature flags
 * 5. **Repeat Test**: Compare performance characteristics
 * 6. **Analyze Results**: Review improvement percentages
 */

import React, { useState } from 'react';
import { FEATURE_FLAGS, isFeatureEnabled, PerformanceTracker } from '../config/featureFlags';

/**
 * Performance metrics data structure for A/B testing analysis
 *
 * @interface PerformanceMetrics
 * @property {string} implementation - Human-readable implementation name
 * @property {number} renderCount - Total component re-renders during test
 * @property {number} stateUpdateCount - Number of state mutations
 * @property {number} memoryUsage - JavaScript heap size in bytes
 * @property {number} avgUpdateTime - Average milliseconds between updates
 * @property {number} timestamp - Recording timestamp for temporal analysis
 */
interface PerformanceMetrics {
  implementation: string;
  renderCount: number;
  stateUpdateCount: number;
  memoryUsage: number;
  avgUpdateTime: number;
  timestamp: number;
}

/**
 * Performance Comparison Tool - A/B Testing Dashboard Component
 *
 * Interactive development tool providing comprehensive performance analysis
 * for comparing different implementation strategies. Integrates with the
 * PerformanceTracker system to collect real-time metrics and provide
 * actionable optimization insights.
 *
 * @component PerformanceComparison
 * @returns {JSX.Element} Floating dashboard with performance controls and analysis
 *
 * @features
 * - **Real-time Recording**: Start/stop metrics collection
 * - **Multiple Snapshots**: Compare different implementation runs
 * - **Automatic Analysis**: Calculate improvement percentages
 * - **Memory Monitoring**: JavaScript heap usage tracking (Chrome)
 * - **Visual Dashboard**: Formatted metrics with temporal grouping
 * - **Developer Guidance**: Tips for feature flag configuration
 *
 * @metrics_collected
 * - **Render Efficiency**: Component re-render frequency
 * - **State Performance**: Update counts and timing
 * - **Memory Footprint**: Heap allocation tracking
 * - **Update Latency**: Real-time responsiveness measurement
 *
 * @analysis_capabilities
 * - **Baseline Comparison**: First recording serves as baseline
 * - **Improvement Calculation**: Percentage optimization metrics
 * - **Temporal Tracking**: Time-based performance evolution
 * - **Cross-Implementation**: Feature flag based A/B testing
 *
 * @usage_in_development
 * 1. Enable performance comparison in feature flags
 * 2. Start recording before test scenario
 * 3. Execute representative solver workload
 * 4. Stop recording to capture snapshot
 * 5. Modify implementation (feature flags)
 * 6. Repeat test with new configuration
 * 7. Compare optimization results
 *
 * @browser_compatibility
 * - Memory metrics require Chrome/Chromium with performance.memory API
 * - Fallback to "N/A" display for unsupported browsers
 * - Core functionality works across all modern browsers
 *
 * @example
 * ```tsx
 * // Enable in development builds only
 * {process.env.NODE_ENV === 'development' && <PerformanceComparison />}
 * ```
 */
export default function PerformanceComparison() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const getCurrentImplementation = () => {
    return 'Immer Structural Sharing (Production)';
  };

  const recordMetrics = () => {
    const report = PerformanceTracker.getReport();
    const newMetric: PerformanceMetrics = {
      implementation: getCurrentImplementation(),
      renderCount: report.renderCount,
      stateUpdateCount: report.stateUpdateCount,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      avgUpdateTime: report.avgTimeBetweenUpdates,
      timestamp: Date.now()
    };

    setMetrics(prev => [...prev, newMetric]);
    PerformanceTracker.reset();
  };

  const clearMetrics = () => {
    setMetrics([]);
    PerformanceTracker.reset();
  };

  const toggleRecording = () => {
    if (isRecording) {
      recordMetrics();
    } else {
      PerformanceTracker.reset();
    }
    setIsRecording(!isRecording);
  };

  const formatMemory = (bytes: number) => {
    if (bytes === 0) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatTime = (ms: number) => {
    if (ms === 0 || !isFinite(ms)) return 'N/A';
    return `${ms.toFixed(2)}ms`;
  };

  return (
    <div className="fixed top-4 right-4 w-96 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Performance Comparison Tool</h3>
        <div className="flex gap-2">
          <button
            onClick={toggleRecording}
            className={`px-3 py-1 rounded text-xs font-medium ${
              isRecording
                ? 'bg-red-500 text-white'
                : 'bg-green-500 text-white'
            }`}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
          <button
            onClick={clearMetrics}
            className="px-3 py-1 rounded text-xs font-medium bg-gray-500 text-white"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm font-medium text-blue-800">Current Implementation</div>
        <div className="text-lg font-bold text-blue-900">{getCurrentImplementation()}</div>
        {isRecording && (
          <div className="text-xs text-blue-600 mt-1">
            🔴 Recording performance data...
          </div>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {metrics.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No performance data yet<br />
            <span className="text-xs">Click "Start Recording", run the solver, then click "Stop Recording"</span>
          </div>
        ) : (
          metrics.map((metric, index) => (
            <div key={index} className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-800">{metric.implementation}</span>
                <span className="text-xs text-slate-500">
                  {new Date(metric.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-600">Renders:</span>
                  <span className="font-mono ml-1">{metric.renderCount}</span>
                </div>
                <div>
                  <span className="text-slate-600">State Updates:</span>
                  <span className="font-mono ml-1">{metric.stateUpdateCount}</span>
                </div>
                <div>
                  <span className="text-slate-600">Memory Usage:</span>
                  <span className="font-mono ml-1">{formatMemory(metric.memoryUsage)}</span>
                </div>
                <div>
                  <span className="text-slate-600">Avg Latency:</span>
                  <span className="font-mono ml-1">{formatTime(metric.avgUpdateTime)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {metrics.length > 1 && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <div className="text-sm font-medium text-green-800 mb-2">Optimization Results</div>
          <div className="text-xs space-y-1">
            {(() => {
              const latest = metrics[metrics.length - 1];
              const baseline = metrics[0];
              const renderImprovement = ((baseline.renderCount - latest.renderCount) / baseline.renderCount * 100);
              const memoryImprovement = ((baseline.memoryUsage - latest.memoryUsage) / baseline.memoryUsage * 100);

              return (
                <>
                  <div>Render optimization: {renderImprovement > 0 ? '-' : '+'}{Math.abs(renderImprovement).toFixed(1)}%</div>
                  <div>Memory optimization: {memoryImprovement > 0 ? '-' : '+'}{Math.abs(memoryImprovement).toFixed(1)}%</div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-slate-500">
        💡 Tip: Modify featureFlags.ts to switch between implementations for comparison
      </div>
    </div>
  );
}