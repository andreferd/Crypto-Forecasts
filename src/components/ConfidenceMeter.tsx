import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '../constants/colors';
import { PriceBracket } from '../types/market';
import { computeConfidence } from '../utils/marketAnalytics';

interface ConfidenceMeterProps {
  brackets: PriceBracket[];
}

const SIZE = 120;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CENTER = SIZE / 2;

function describeArc(startAngle: number, endAngle: number): string {
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const x1 = CENTER + RADIUS * Math.cos(startRad);
  const y1 = CENTER + RADIUS * Math.sin(startRad);
  const x2 = CENTER + RADIUS * Math.cos(endRad);
  const y2 = CENTER + RADIUS * Math.sin(endRad);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2}`;
}

export function ConfidenceMeter({ brackets }: ConfidenceMeterProps) {
  const confidence = useMemo(() => computeConfidence(brackets), [brackets]);

  const color =
    confidence >= 60
      ? Colors.confidenceHigh
      : confidence >= 35
        ? Colors.confidenceMid
        : Colors.confidenceLow;

  const label =
    confidence >= 60 ? 'High' : confidence >= 35 ? 'Medium' : 'Low';

  // Arc goes from 180° (left) to 360° (right) — semicircle
  const arcEnd = 180 + (confidence / 100) * 180;

  // Needle tip position
  const needleAngle = (arcEnd * Math.PI) / 180;
  const needleX = CENTER + (RADIUS - 4) * Math.cos(needleAngle);
  const needleY = CENTER + (RADIUS - 4) * Math.sin(needleAngle);

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE / 2 + 10} viewBox={`0 ${SIZE / 2 - STROKE} ${SIZE} ${SIZE / 2 + STROKE + 10}`}>
        {/* Background arc */}
        <Path
          d={describeArc(180, 360)}
          stroke={Colors.surfaceLight}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
        />
        {/* Filled arc */}
        {confidence > 0 && (
          <Path
            d={describeArc(180, arcEnd)}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
          />
        )}
        {/* Needle dot */}
        <Circle cx={needleX} cy={needleY} r={4} fill={color} />
      </Svg>
      <View style={styles.labels}>
        <Text style={[styles.score, { color }]}>{confidence}</Text>
        <Text style={styles.sublabel}>Confidence: {label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  labels: {
    alignItems: 'center',
    marginTop: -4,
  },
  score: {
    fontSize: 24,
    fontWeight: '700',
  },
  sublabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
