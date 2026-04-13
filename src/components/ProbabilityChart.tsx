import React, { useState, useRef, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { PriceBracket } from '../types/market';
import { VolumeBadge } from './VolumeBadge';
import { computeProbabilityBands } from '../utils/marketAnalytics';

interface ProbabilityChartProps {
  brackets: PriceBracket[];
  accentColor?: string;
}

function ExpandableBar({
  bracket,
  maxProb,
  accentColor,
  isInRange50,
}: {
  bracket: PriceBracket;
  maxProb: number;
  accentColor: string;
  isInRange50: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const heightAnim = useRef(new Animated.Value(18)).current;

  const toggle = () => {
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
      style={[styles.barRow, isInRange50 && styles.barRowHighlight]}
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
        {expanded && (
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

export function ProbabilityChart({ brackets, accentColor = Colors.chartBar }: ProbabilityChartProps) {
  if (brackets.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const maxProb = Math.max(...brackets.map((b) => b.probability));

  // Compute 50% range for highlighting
  const bands = useMemo(() => computeProbabilityBands(brackets), [brackets]);
  const range50 = bands.range50;

  const isInRange50 = (bracket: PriceBracket): boolean => {
    if (!range50) return false;
    const floor = bracket.floorStrike ?? -Infinity;
    const cap = bracket.capStrike ?? Infinity;
    return floor >= range50.low && cap <= range50.high;
  };

  return (
    <View style={styles.container}>
      {/* Range band legend */}
      {range50 && (
        <View style={styles.bandLegend}>
          <View style={[styles.bandDot, { backgroundColor: Colors.rangeBand50 }]} />
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
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  bandLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bandDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  bandText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  barRowHighlight: {
    backgroundColor: Colors.rangeBand50,
  },
  rangeLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    width: 80,
    textAlign: 'right',
    marginTop: 2,
  },
  barContainer: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    borderRadius: 4,
    minWidth: 2,
  },
  expandedInfo: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: 'center',
  },
  oiText: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  probLabel: {
    fontSize: 11,
    color: Colors.text,
    width: 36,
    textAlign: 'right',
    fontWeight: '600',
    marginTop: 2,
  },
  empty: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
});
