/**
 * @fileoverview Sparkline - Micro Chart Visualization Component
 *
 * Lightweight SVG-based sparkline component for displaying performance trends
 * and metrics visualization. Provides compact, inline charts optimized for
 * dashboard and monitoring interfaces with minimal visual footprint.
 *
 * @module components/Sparkline
 * @version 1.0.0
 * @since Phase-2-Architecture-Finalization
 *
 * @architecture
 * - **SVG Rendering**: Scalable vector graphics for crisp display at any size
 * - **Data Normalization**: Automatic scaling to fit available space
 * - **Responsive Design**: Configurable dimensions with preserved aspect ratio
 * - **Performance Optimized**: Memoized component with efficient path generation
 * - **Accessibility**: Proper viewBox and overflow handling
 *
 * @visualization_features
 * - **Trend Lines**: Smooth polyline paths connecting data points
 * - **Auto Scaling**: Automatic Y-axis scaling to data range
 * - **Customization**: Configurable colors, dimensions, and stroke properties
 * - **Fallback Display**: Graceful handling of insufficient data
 * - **Responsive**: Maintains proportions across different display sizes
 *
 * @use_cases
 * - **Performance Metrics**: Real-time algorithm performance trends
 * - **Dashboard Widgets**: Compact metric visualization in control panels
 * - **Historical Data**: Time-series data display in condensed format
 * - **Comparison Charts**: Side-by-side trend comparison
 * - **Monitoring Displays**: Live system metrics visualization
 */

import React from 'react';

/**
 * Props interface for Sparkline component
 *
 * @interface SparklineProps
 * @property {number[]} data - Array of numeric values to plot
 * @property {number} [width=100] - SVG width in pixels
 * @property {number} [height=20] - SVG height in pixels
 * @property {string} [color='#4f46e5'] - Stroke color (CSS color value)
 * @property {number} [strokeWidth=1.5] - Line thickness in pixels
 */
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Sparkline Component - Compact Performance Trend Visualization
 *
 * Minimalist chart component for displaying numeric trends in constrained space.
 * Automatically scales data to fit dimensions and provides smooth line rendering
 * with customizable appearance. Optimized for dashboard and inline metrics display.
 *
 * @component Sparkline
 * @param {Object} props - Chart configuration and data
 * @param {number[]} props.data - Numeric array to visualize as trend line
 * @param {number} [props.width=100] - Chart width in pixels
 * @param {number} [props.height=20] - Chart height in pixels
 * @param {string} [props.color='#4f46e5'] - Line color (indigo-600 default)
 * @param {number} [props.strokeWidth=1.5] - Line thickness
 * @returns {JSX.Element} SVG-based sparkline chart or fallback placeholder
 *
 * @features
 * - **Auto-scaling**: Normalizes data to fit chart dimensions
 * - **Smooth Rendering**: SVG paths with rounded line caps and joins
 * - **Data Validation**: Handles edge cases (empty, single data point)
 * - **Performance**: Memoized to prevent unnecessary re-renders
 * - **Responsive**: Maintains aspect ratio across different sizes
 *
 * @algorithm
 * 1. **Data Validation**: Check for minimum 2 data points
 * 2. **Range Calculation**: Find min/max values for Y-axis scaling
 * 3. **Point Mapping**: Convert data points to SVG coordinates
 * 4. **Path Generation**: Create SVG path string from coordinate points
 * 5. **Rendering**: Draw path with specified styling
 *
 * @fallback_behavior
 * When data is insufficient (< 2 points), displays a neutral gray placeholder
 * rectangle matching the requested dimensions to maintain layout consistency.
 *
 * @example
 * ```tsx
 * // Basic usage with defaults
 * <Sparkline data={[1, 3, 2, 5, 4, 6]} />
 *
 * // Custom styling and dimensions
 * <Sparkline
 *   data={performanceMetrics}
 *   width={80}
 *   height={16}
 *   color="#ef4444"
 *   strokeWidth={2}
 * />
 *
 * // Empty data handling
 * <Sparkline data={[]} /> // Shows gray placeholder
 * ```
 *
 * @integration
 * - Used in ControlsCard for performance metrics visualization
 * - Integrated with PerformanceTracker for real-time trend display
 * - Supports dynamic data updates for live monitoring
 * - Compatible with dashboard layouts and metric panels
 *
 * @performance_considerations
 * - Memoized with React.memo to prevent re-renders on unchanged props
 * - Efficient SVG path generation with minimal DOM manipulation
 * - Lightweight implementation suitable for multiple concurrent instances
 * - No external dependencies beyond React
 */
const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 20,
  color = '#4f46e5', // indigo-600
  strokeWidth = 1.5
}) => {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="bg-slate-100 rounded-sm" />;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / (range || 1)) * height;
    return `${x},${y}`;
  });

  const path = `M ${points.join(' L ')}`;

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ overflow: 'visible' }}
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default React.memo(Sparkline);
