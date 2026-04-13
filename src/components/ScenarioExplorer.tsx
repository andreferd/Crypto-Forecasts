import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Line, Circle } from 'react-native-svg';
import { Colors } from '../constants/colors';
import { PriceBracket } from '../types/market';

interface ScenarioExplorerProps {
  brackets: PriceBracket[];
  accentColor: string;
}

function formatPrice(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(value).toLocaleString()}`;
}

export function ScenarioExplorer({ brackets, accentColor }: ScenarioExplorerProps) {
  const [sliderWidth, setSliderWidth] = useState(280);
  const [thumbX, setThumbX] = useState(0.5); // 0-1 ratio

  // Compute price range from brackets
  const { minPrice, maxPrice } = useMemo(() => {
    const floors = brackets.filter((b) => b.floorStrike != null).map((b) => b.floorStrike!);
    const caps = brackets.filter((b) => b.capStrike != null).map((b) => b.capStrike!);
    const all = [...floors, ...caps];
    if (all.length === 0) return { minPrice: 0, maxPrice: 100000 };
    return { minPrice: Math.min(...all), maxPrice: Math.max(...all) };
  }, [brackets]);

  const currentPrice = minPrice + thumbX * (maxPrice - minPrice);

  // Compute probability of being above or below this price
  const { probAbove, probBelow } = useMemo(() => {
    const total = brackets.reduce((s, b) => s + b.probability, 0);
    if (total === 0) return { probAbove: 0, probBelow: 0 };

    let below = 0;
    let above = 0;
    for (const b of brackets) {
      const mid =
        b.floorStrike != null && b.capStrike != null
          ? (b.floorStrike + b.capStrike) / 2
          : b.floorStrike ?? b.capStrike ?? 0;

      if (mid <= currentPrice) {
        below += b.probability;
      } else {
        above += b.probability;
      }
    }

    const norm = (v: number) => Math.round((v / total) * 100);
    return { probAbove: norm(above), probBelow: norm(below) };
  }, [brackets, currentPrice]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setSliderWidth(e.nativeEvent.layout.width);
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const ratio = Math.max(0, Math.min(1, evt.nativeEvent.locationX / sliderWidth));
          setThumbX(ratio);
        },
        onPanResponderMove: (evt) => {
          const ratio = Math.max(0, Math.min(1, evt.nativeEvent.locationX / sliderWidth));
          setThumbX(ratio);
        },
      }),
    [sliderWidth],
  );

  if (brackets.length === 0) return null;

  const dotX = thumbX * sliderWidth;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What if {formatPrice(currentPrice)}?</Text>

      {/* Slider */}
      <View style={styles.sliderContainer} onLayout={onLayout} {...panResponder.panHandlers}>
        <Svg width={sliderWidth} height={30}>
          {/* Track */}
          <Line
            x1={0} y1={15} x2={sliderWidth} y2={15}
            stroke={Colors.surfaceLight}
            strokeWidth={4}
            strokeLinecap="round"
          />
          {/* Filled portion */}
          <Line
            x1={0} y1={15} x2={dotX} y2={15}
            stroke={accentColor}
            strokeWidth={4}
            strokeLinecap="round"
          />
          {/* Thumb */}
          <Circle cx={dotX} cy={15} r={10} fill={accentColor} />
          <Circle cx={dotX} cy={15} r={6} fill={Colors.surface} />
        </Svg>
      </View>

      {/* Price range labels */}
      <View style={styles.rangeLabels}>
        <Text style={styles.rangeText}>{formatPrice(minPrice)}</Text>
        <Text style={styles.rangeText}>{formatPrice(maxPrice)}</Text>
      </View>

      {/* Probability result */}
      <View style={styles.results}>
        <View style={styles.resultBlock}>
          <Text style={[styles.resultValue, { color: Colors.error }]}>{probBelow}%</Text>
          <Text style={styles.resultLabel}>Below</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.resultBlock}>
          <Text style={[styles.resultValue, { color: Colors.success }]}>{probAbove}%</Text>
          <Text style={styles.resultLabel}>Above</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  sliderContainer: {
    height: 30,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 16,
  },
  rangeText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  results: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  resultBlock: {
    alignItems: 'center',
  },
  resultValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  resultLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
});
