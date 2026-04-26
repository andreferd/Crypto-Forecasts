import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Path, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import { colors, typography } from '../theme';
import { PriceBracket } from '../types/market';

interface Props {
  brackets: PriceBracket[];
  accentColor: string;
  height?: number;
  width?: number;
  /** Optional vertical marker (e.g., spot price). */
  spotPrice?: number | null;
  /** Show min/max price labels on x-axis. */
  showAxis?: boolean;
}

function formatPriceShort(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(v)}`;
}

/**
 * Smoothed area-chart visualization of a probability distribution.
 * Each bracket contributes a "step" whose height is its probability;
 * we draw a smooth curve through the bracket midpoints and fill below.
 */
export function DistributionCurve({
  brackets,
  accentColor,
  height = 90,
  width = 320,
  spotPrice,
  showAxis = true,
}: Props) {
  const labelHeight = showAxis ? 14 : 0;
  const chartHeight = height - labelHeight;

  const computed = useMemo(() => {
    // Filter to brackets with at least a one-sided strike to position on x-axis
    const sorted = brackets
      .filter((b) => b.floorStrike != null || b.capStrike != null)
      .sort((a, b) => {
        const af = a.floorStrike ?? a.capStrike ?? 0;
        const bf = b.floorStrike ?? b.capStrike ?? 0;
        return af - bf;
      });
    if (sorted.length < 2) return null;

    // Compute domain: from lowest floor to highest cap.
    // Open-ended brackets approximated using ±10%.
    const xs: { mid: number; prob: number; floor: number; cap: number }[] = sorted.map((b) => {
      const floor = b.floorStrike ?? (b.capStrike != null ? b.capStrike * 0.9 : 0);
      const cap = b.capStrike ?? (b.floorStrike != null ? b.floorStrike * 1.1 : 0);
      const mid = (floor + cap) / 2;
      return { mid, prob: b.probability, floor, cap };
    });

    const xMin = xs[0].floor;
    const xMax = xs[xs.length - 1].cap;
    const xRange = xMax - xMin || 1;
    const maxProb = Math.max(...xs.map((d) => d.prob), 1);

    const px = (v: number) => ((v - xMin) / xRange) * width;
    const py = (p: number) => chartHeight - (p / maxProb) * (chartHeight - 2);

    // Build a smoothed area path through midpoints.
    // Use Catmull-Rom-ish bezier smoothing.
    const points = xs.map((d) => ({ x: px(d.mid), y: py(d.prob) }));

    // Anchor curve to baseline at left and right edges
    const baseY = chartHeight;
    const startX = points[0].x;
    const endX = points[points.length - 1].x;

    let path = `M ${startX} ${baseY} L ${startX} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    path += ` L ${endX} ${baseY} Z`;

    // Stroke path (curve only, no fill close)
    let strokePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      strokePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const spotX =
      spotPrice != null && spotPrice >= xMin && spotPrice <= xMax ? px(spotPrice) : null;

    return { path, strokePath, xMin, xMax, spotX };
  }, [brackets, width, chartHeight, spotPrice]);

  if (!computed) {
    return <View style={{ width, height, justifyContent: 'center' }} />;
  }

  const gradientId = `grad-${accentColor.replace('#', '')}`;

  return (
    <View>
      <Svg width={width} height={chartHeight}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={accentColor} stopOpacity="0.5" />
            <Stop offset="100%" stopColor={accentColor} stopOpacity="0.05" />
          </LinearGradient>
        </Defs>
        {/* Filled area */}
        <Path d={computed.path} fill={`url(#${gradientId})`} />
        {/* Stroke on top edge */}
        <Path
          d={computed.strokePath}
          stroke={accentColor}
          strokeWidth={1.6}
          fill="none"
          strokeLinejoin="round"
        />
        {/* Spot marker */}
        {computed.spotX != null && (
          <Line
            x1={computed.spotX}
            y1={0}
            x2={computed.spotX}
            y2={chartHeight}
            stroke={colors.text2}
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        )}
      </Svg>
      {showAxis && (
        <View style={[styles.axisRow, { width }]}>
          <Text style={styles.axisLabel}>{formatPriceShort(computed.xMin)}</Text>
          {computed.spotX != null && spotPrice != null && (
            <Text
              style={[
                styles.spotLabel,
                {
                  position: 'absolute',
                  left: Math.max(0, computed.spotX - 24),
                },
              ]}
            >
              spot {formatPriceShort(spotPrice)}
            </Text>
          )}
          <Text style={styles.axisLabel}>{formatPriceShort(computed.xMax)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 2,
    position: 'relative',
  },
  axisLabel: {
    ...typography.caption,
    fontSize: 9,
    lineHeight: 12,
    color: colors.text3,
  },
  spotLabel: {
    ...typography.caption,
    fontSize: 9,
    lineHeight: 12,
    color: colors.text2,
  },
});
