import React, { useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Text } from 'react-native-paper';
import { colors, typography } from '../theme';

interface Props {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  width?: number;
  height?: number;
  accentColor?: string;
}

const TICK_WIDTH = 8;

function formatPriceShort(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  if (v >= 1) return `$${Math.round(v)}`;
  if (v >= 0.01) return `$${v.toFixed(2)}`;
  return `$${v.toFixed(4)}`;
}

export function PriceTape({
  min,
  max,
  step,
  value,
  onChange,
  width = 300,
  height = 56,
  accentColor = colors.accent,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const userScrolling = useRef(false);

  const tickCount = Math.max(1, Math.floor((max - min) / step) + 1);
  const totalContentWidth = tickCount * TICK_WIDTH;
  const sidePad = width / 2 - TICK_WIDTH / 2;

  const majorEvery = tickCount > 200 ? 20 : tickCount > 100 ? 10 : 5;

  const ticks = useMemo(
    () =>
      Array.from({ length: tickCount }, (_, i) => ({
        x: i * TICK_WIDTH,
        price: min + i * step,
        isMajor: i % majorEvery === 0,
      })),
    [tickCount, min, step, majorEvery],
  );

  // Sync external value -> scroll position when not actively scrolling
  useEffect(() => {
    if (userScrolling.current) return;
    const idx = Math.round((value - min) / step);
    const clamped = Math.max(0, Math.min(tickCount - 1, idx));
    scrollRef.current?.scrollTo({ x: clamped * TICK_WIDTH, animated: false });
  }, [value, min, step, tickCount]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.max(0, Math.min(tickCount - 1, Math.round(x / TICK_WIDTH)));
      const newPrice = min + idx * step;
      if (newPrice !== value) onChange(newPrice);
    },
    [min, step, onChange, value, tickCount],
  );

  return (
    <View style={[styles.container, { width, height }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={TICK_WIDTH}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onScrollBeginDrag={() => {
          userScrolling.current = true;
        }}
        onMomentumScrollEnd={() => {
          userScrolling.current = false;
        }}
        onScrollEndDrag={() => {
          // If user lifts finger without momentum, also clear
          setTimeout(() => {
            userScrolling.current = false;
          }, 50);
        }}
        contentContainerStyle={{ paddingHorizontal: sidePad }}
      >
        <View style={{ width: totalContentWidth, height }}>
          {ticks.map((t) => (
            <View
              key={`t-${t.x}`}
              style={[
                styles.tick,
                {
                  left: t.x,
                  height: t.isMajor ? 14 : 7,
                  backgroundColor: t.isMajor ? colors.text3 : colors.border,
                },
              ]}
            />
          ))}
          {ticks
            .filter((t) => t.isMajor)
            .map((t) => (
              <Text key={`l-${t.x}`} style={[styles.label, { left: t.x - 18 }]}>
                {formatPriceShort(t.price)}
              </Text>
            ))}
        </View>
      </ScrollView>
      <View
        pointerEvents="none"
        style={[styles.indicator, { left: width / 2 - 1, backgroundColor: accentColor }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  tick: {
    position: 'absolute',
    top: 0,
    width: 1,
  },
  label: {
    position: 'absolute',
    top: 18,
    width: 36,
    textAlign: 'center',
    ...typography.caption,
    fontSize: 9,
    lineHeight: 12,
    color: colors.text3,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    bottom: 16,
    width: 2,
    borderRadius: 1,
  },
});
