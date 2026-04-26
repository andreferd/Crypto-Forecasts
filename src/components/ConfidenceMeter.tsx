import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, typography } from '../theme';
import { confidenceColor, confidenceLabel } from '../theme/semantics';
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
  const color = confidenceColor(confidence);
  const label = confidenceLabel(confidence);

  const arcEnd = 180 + (confidence / 100) * 180;

  const needleAngle = (arcEnd * Math.PI) / 180;
  const needleX = CENTER + (RADIUS - 4) * Math.cos(needleAngle);
  const needleY = CENTER + (RADIUS - 4) * Math.sin(needleAngle);

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE / 2 + 10} viewBox={`0 ${SIZE / 2 - STROKE} ${SIZE} ${SIZE / 2 + STROKE + 10}`}>
        <Path
          d={describeArc(180, 360)}
          stroke={colors.surface2}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
        />
        {confidence > 0 && (
          <Path
            d={describeArc(180, arcEnd)}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
          />
        )}
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
    ...typography.display,
  },
  sublabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text2,
    marginTop: 2,
  },
});
