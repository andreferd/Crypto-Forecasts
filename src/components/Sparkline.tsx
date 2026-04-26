import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { ForecastPoint } from '../services/forecastHistory';

interface SparklineProps {
  data?: ForecastPoint[];
  width?: number;
  height?: number;
  color: string;
  /** Number of trailing days to show. Defaults to 7. */
  days?: number;
}

/**
 * Tiny forecast trend line. Renders nothing if data is missing or too short.
 */
export function Sparkline({
  data,
  width = 60,
  height = 22,
  color,
  days = 7,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return <View style={{ width, height }} />;
  }

  const windowed = data.slice(-days * 2).slice(-Math.min(data.length, days * 2));
  const values = windowed.map((d) => d.forecast);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.15 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const range = hi - lo || 1;

  const points = windowed
    .map((d, i) => {
      const x = (i / (windowed.length - 1)) * width;
      const y = height - ((d.forecast - lo) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  const lastX = width;
  const lastY = height - ((values[values.length - 1] - lo) / range) * height;

  return (
    <Svg width={width} height={height}>
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Circle cx={lastX - 1} cy={lastY} r={2} fill={color} />
    </Svg>
  );
}
