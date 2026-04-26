import React, { useState, useRef, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing, radii, typography } from '../theme';
import { PriceBracket } from '../types/market';
import { VolumeBadge } from './VolumeBadge';
import { computeProbabilityBands } from '../utils/marketAnalytics';

interface ProbabilityChartProps {
  brackets: PriceBracket[];
  accentColor?: string;
  /** When set, tapping a bar invokes this callback instead of expanding details. */
  onSelectBracket?: (bracket: PriceBracket) => void;
  /** ticker of the bracket currently selected (highlight). Only used with onSelectBracket. */
  selectedTicker?: string;
}

function ExpandableBar({
  bracket,
  maxProb,
  accentColor,
  isInRange50,
  onSelect,
  selected,
}: {
  bracket: PriceBracket;
  maxProb: number;
  accentColor: string;
  isInRange50: boolean;
  onSelect?: () => void;
  selected?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const heightAnim = useRef(new Animated.Value(18)).current;

  const toggle = () => {
    if (onSelect) {
      onSelect();
      return;
    }
    const toExpanded = !expanded;
    setExpanded(toExpanded);
    Animated.spring(heightAnim, {
      toValue: toExpanded ? 48 : 18,
      useNativeDriver: false,
      friction: 8,
    }).start();
  };

  const barWidth = maxProb > 0 ? (bracket.probability / maxProb) * 100 : 0;

  return (
    <TouchableOpacity
      style={[
        styles.barRow,
        isInRange50 && styles.barRowHighlight,
        selected && styles.barRowSelected,
      ]}
      onPress={toggle}
      activeOpacity={0.8}
    >
      <Text style={styles.rangeLabel} numberOfLines={1}>
        {bracket.displayRange}
      </Text>
      <View style={styles.barContainer}>
        <Animated.View style={{ height: heightAnim, width: '100%' }}>
          <View
            style={[
              styles.bar,
              {
                width: `${barWidth}%`,
                backgroundColor: accentColor,
                opacity: 0.3 + (bracket.probability / maxProb) * 0.7,
                height: '100%',
              },
            ]}
          />
        </Animated.View>
        {expanded && !onSelect && (
          <View style={styles.expandedInfo}>
            <VolumeBadge volume={bracket.volume} />
            <Text style={styles.oiText}>
              OI: {bracket.openInterest > 0 ? Math.round(bracket.openInterest).toLocaleString() : '—'}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.probLabel}>{bracket.probability}%</Text>
    </TouchableOpacity>
  );
}

export function ProbabilityChart({
  brackets,
  accentColor = colors.accent,
  onSelectBracket,
  selectedTicker,
}: ProbabilityChartProps) {
  const bands = useMemo(() => computeProbabilityBands(brackets), [brackets]);

  if (brackets.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const maxProb = Math.max(...brackets.map((b) => b.probability));
  const range50 = bands.range50;

  const isInRange50 = (bracket: PriceBracket): boolean => {
    if (!range50) return false;
    const floor = bracket.floorStrike ?? -Infinity;
    const cap = bracket.capStrike ?? Infinity;
    return floor >= range50.low && cap <= range50.high;
  };

  return (
    <View style={styles.container}>
      {range50 && (
        <View style={styles.bandLegend}>
          <View style={[styles.bandDot, { backgroundColor: colors.rangeBand50 }]} />
          <Text style={styles.bandText}>50% probability range</Text>
        </View>
      )}
      {brackets.map((bracket) => (
        <ExpandableBar
          key={bracket.ticker}
          bracket={bracket}
          maxProb={maxProb}
          accentColor={accentColor}
          isInRange50={isInRange50(bracket)}
          onSelect={onSelectBracket ? () => onSelectBracket(bracket) : undefined}
          selected={selectedTicker === bracket.ticker}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs + 2,
  },
  bandLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginBottom: spacing.xs,
  },
  bandDot: {
    width: 12,
    height: 12,
    borderRadius: radii.sm,
  },
  bandText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text3,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.sm,
  },
  barRowHighlight: {
    backgroundColor: colors.rangeBand50,
  },
  barRowSelected: {
    backgroundColor: colors.accent + '22',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  rangeLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text2,
    width: 80,
    textAlign: 'right',
    marginTop: 2,
  },
  barContainer: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  bar: {
    borderRadius: radii.sm,
    minWidth: 2,
  },
  expandedInfo: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  oiText: {
    fontSize: 9,
    lineHeight: 12,
    fontFamily: typography.caption.fontFamily,
    color: colors.text3,
  },
  probLabel: {
    ...typography.captionStrong,
    fontSize: 11,
    color: colors.text1,
    width: 36,
    textAlign: 'right',
    marginTop: 2,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.text3,
  },
});
