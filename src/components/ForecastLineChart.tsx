import React, { useMemo, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, LayoutChangeEvent, PanResponder, Vibration } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Polyline, Line, Circle } from 'react-native-svg';
import { colors, spacing, typography } from '../theme';
import { ForecastPoint } from '../services/forecastHistory';

interface ForecastLineChartProps {
  data: ForecastPoint[];
  accentColor: string;
  label?: string;
}

const CHART_HEIGHT = 200;
const PADDING = { top: 10, bottom: 30, left: 50, right: 16 };

function formatPrice(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(value)}`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function ForecastLineChart({
  data,
  accentColor,
  label,
}: ForecastLineChartProps) {
  const [chartWidth, setChartWidth] = useState(300);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const prevActiveIndex = useRef<number | null>(null);

  const drawWidth = chartWidth - PADDING.left - PADDING.right;
  const drawHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const { minVal, maxVal, points, yLabels, xLabels } = useMemo(() => {
    if (data.length === 0) {
      return { minVal: 0, maxVal: 0, points: '', yLabels: [], xLabels: [] };
    }

    const values = data.map((d) => d.forecast);
    let min = Math.min(...values);
    let max = Math.max(...values);
    const pad = (max - min) * 0.08 || max * 0.05;
    min -= pad;
    max += pad;

    const pts = data
      .map((d, i) => {
        const x = PADDING.left + (i / (data.length - 1)) * drawWidth;
        const y = PADDING.top + drawHeight - ((d.forecast - min) / (max - min)) * drawHeight;
        return `${x},${y}`;
      })
      .join(' ');

    const yLabelCount = 4;
    const yLbls = Array.from({ length: yLabelCount }, (_, i) => {
      const val = max - (i / (yLabelCount - 1)) * (max - min);
      const y = PADDING.top + (i / (yLabelCount - 1)) * drawHeight;
      return { val, y };
    });

    const xLabelCount = 5;
    const xLbls = Array.from({ length: xLabelCount }, (_, i) => {
      const idx = Math.floor((i / (xLabelCount - 1)) * (data.length - 1));
      const x = PADDING.left + (idx / (data.length - 1)) * drawWidth;
      return { label: formatDate(data[idx].timestamp), x };
    });

    return { minVal: min, maxVal: max, points: pts, yLabels: yLbls, xLabels: xLbls };
  }, [data, drawWidth, drawHeight]);

  const getIndexFromX = useCallback(
    (touchX: number) => {
      if (data.length === 0) return null;
      const relX = touchX - PADDING.left;
      const ratio = Math.max(0, Math.min(1, relX / drawWidth));
      return Math.round(ratio * (data.length - 1));
    },
    [data, drawWidth],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const idx = getIndexFromX(evt.nativeEvent.locationX);
          if (idx !== prevActiveIndex.current) {
            Vibration.vibrate(1);
            prevActiveIndex.current = idx;
          }
          setActiveIndex(idx);
        },
        onPanResponderMove: (evt) => {
          const idx = getIndexFromX(evt.nativeEvent.locationX);
          if (idx !== prevActiveIndex.current) {
            Vibration.vibrate(1);
            prevActiveIndex.current = idx;
          }
          setActiveIndex(idx);
        },
        onPanResponderRelease: () => {
          prevActiveIndex.current = null;
          setTimeout(() => setActiveIndex(null), 2000);
        },
      }),
    [getIndexFromX],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    setChartWidth(e.nativeEvent.layout.width);
  };

  if (data.length < 2) {
    return (
      <View style={styles.empty}>
        <View style={[styles.skelLine, { backgroundColor: accentColor + '33', top: '40%' }]} />
        <View style={[styles.skelLine, { backgroundColor: colors.text3 + '22', top: '65%' }]} />
      </View>
    );
  }

  const currentValue = data[data.length - 1].forecast;
  const firstValue = data[0].forecast;
  const change = currentValue - firstValue;
  const changePercent = ((change / firstValue) * 100).toFixed(1);
  const isPositive = change >= 0;

  const activePoint = activeIndex != null ? data[activeIndex] : null;
  const activeX =
    activeIndex != null
      ? PADDING.left + (activeIndex / (data.length - 1)) * drawWidth
      : 0;
  const activeY =
    activePoint != null
      ? PADDING.top +
        drawHeight -
        ((activePoint.forecast - minVal) / (maxVal - minVal)) * drawHeight
      : 0;

  const lastX = PADDING.left + drawWidth;
  const lastY =
    PADDING.top +
    drawHeight -
    ((currentValue - minVal) / (maxVal - minVal)) * drawHeight;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.forecastValue, { color: accentColor }]}>
            {activePoint
              ? formatPrice(activePoint.forecast)
              : formatPrice(currentValue)}
          </Text>
          <Text style={styles.forecastLabel}>
            {activePoint ? formatDate(activePoint.timestamp) : 'consensus'}
          </Text>
        </View>
        {!activePoint && (
          <Text
            style={[
              styles.change,
              { color: isPositive ? colors.up : colors.down },
            ]}
          >
            {isPositive ? '+' : ''}
            {formatPrice(Math.abs(change))} ({changePercent}%)
          </Text>
        )}
      </View>

      <View
        style={styles.chartContainer}
        onLayout={onLayout}
        {...panResponder.panHandlers}
      >
        <Svg width={chartWidth} height={CHART_HEIGHT}>
          {yLabels.map((yl, i) => (
            <Line
              key={`grid-${i}`}
              x1={PADDING.left}
              y1={yl.y}
              x2={chartWidth - PADDING.right}
              y2={yl.y}
              stroke={colors.border}
              strokeWidth={0.5}
              strokeDasharray="4,4"
            />
          ))}

          <Polyline
            points={points}
            fill="none"
            stroke={accentColor}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          <Circle cx={lastX} cy={lastY} r={4} fill={accentColor} />
          <Circle cx={lastX} cy={lastY} r={7} fill={accentColor} opacity={0.3} />

          {activePoint != null && (
            <>
              <Line
                x1={activeX}
                y1={PADDING.top}
                x2={activeX}
                y2={PADDING.top + drawHeight}
                stroke={colors.text2}
                strokeWidth={1}
                strokeDasharray="3,3"
              />
              <Circle cx={activeX} cy={activeY} r={5} fill={accentColor} />
              <Circle cx={activeX} cy={activeY} r={9} fill={accentColor} opacity={0.25} />
            </>
          )}
        </Svg>

        {yLabels.map((yl, i) => (
          <View key={`ylabel-${i}`} style={[styles.yLabel, { top: yl.y - 7 }]}>
            <Text style={styles.axisText}>{formatPrice(yl.val)}</Text>
          </View>
        ))}

        <View style={styles.xLabels}>
          {xLabels.map((xl, i) => (
            <Text
              key={`xlabel-${i}`}
              style={[styles.axisText, { position: 'absolute', left: xl.x - 20 }]}
            >
              {xl.label}
            </Text>
          ))}
        </View>
      </View>

      <Text style={styles.hint}>Touch chart to see values</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  forecastValue: {
    ...typography.display,
    ...typography.numeric,
  },
  forecastLabel: {
    ...typography.caption,
    color: colors.text2,
    marginTop: 2,
  },
  change: {
    ...typography.bodyStrong,
    ...typography.numeric,
    marginTop: spacing.xs,
  },
  chartContainer: {
    position: 'relative',
    height: CHART_HEIGHT,
  },
  yLabel: {
    position: 'absolute',
    left: 0,
    width: 46,
  },
  axisText: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 12,
    color: colors.text3,
    textAlign: 'right',
  },
  xLabels: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
  },
  hint: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text3,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  empty: {
    height: 120,
    position: 'relative',
  },
  skelLine: {
    position: 'absolute',
    left: PADDING.left,
    right: 12,
    height: 2,
    borderRadius: 1,
  },
});
