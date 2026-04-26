import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing, radii, typography } from '../theme';
import { TOKENS } from '../constants/tokens';
import { useForecast } from '../hooks/useForecast';
import { computeMarketProbForTarget } from '../utils/predictionScoring';
import { ProbabilityChart } from './ProbabilityChart';
import { PriceBracket } from '../types/market';

interface Props {
  onSubmit: (symbol: string, targetPrice: number, direction: 'above' | 'below') => void;
  initialSymbol?: string;
}

const SYMBOLS = ['BTC', 'ETH', 'SOL'];

function bracketMidpoint(b: PriceBracket): number {
  if (b.floorStrike != null && b.capStrike != null) {
    return (b.floorStrike + b.capStrike) / 2;
  }
  if (b.floorStrike != null) return b.floorStrike * 1.1;
  if (b.capStrike != null) return b.capStrike * 0.9;
  return 0;
}

function formatPrice(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(v).toLocaleString()}`;
}

export function NewPredictionForm({ onSubmit, initialSymbol }: Props) {
  const [symbol, setSymbol] = useState(initialSymbol ?? 'BTC');
  const [selected, setSelected] = useState<PriceBracket | null>(null);
  const [direction, setDirection] = useState<'above' | 'below'>('above');

  const forecast = useForecast(symbol);
  const eoy = forecast.forecasts.find((f) => f.type === 'eoy');
  const brackets = eoy?.brackets ?? [];

  // Reset selection when symbol changes
  React.useEffect(() => {
    setSelected(null);
  }, [symbol]);

  const target = selected ? bracketMidpoint(selected) : null;

  const liveProb = useMemo(() => {
    if (target == null || brackets.length === 0) return null;
    return computeMarketProbForTarget(brackets, target, direction);
  }, [brackets, target, direction]);

  const handleSubmit = () => {
    if (target == null) return;
    onSubmit(symbol, target, direction);
    setSelected(null);
  };

  const brandColor = TOKENS[symbol]?.color ?? colors.accent;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Make a call</Text>
      <Text style={styles.subtitle}>
        Tap a price range below — that's your bet for end of year.
      </Text>

      <View style={styles.symbolRow}>
        {SYMBOLS.map((s) => {
          const token = TOKENS[s];
          const active = s === symbol;
          return (
            <TouchableOpacity
              key={s}
              style={[
                styles.symbolPill,
                active && {
                  backgroundColor: (token?.color ?? colors.accent) + '22',
                  borderColor: token?.color ?? colors.accent,
                },
              ]}
              onPress={() => setSymbol(s)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.symbolPillText,
                  active && { color: token?.color ?? colors.accent },
                ]}
              >
                {token?.icon ?? ''} {s}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.chartWrap}>
        {brackets.length === 0 ? (
          <Text style={styles.empty}>Loading {symbol} brackets…</Text>
        ) : (
          <ProbabilityChart
            brackets={brackets}
            accentColor={brandColor}
            onSelectBracket={setSelected}
            selectedTicker={selected?.ticker}
          />
        )}
      </View>

      {selected ? (
        <View style={styles.selectionPanel}>
          <View style={styles.selectionLine}>
            <Text style={styles.selectionLabel}>Your call</Text>
            <Text style={styles.selectionValue}>
              {symbol} {direction} {formatPrice(target ?? 0)}
            </Text>
          </View>

          <View style={styles.directionRow}>
            <DirectionBtn label="Above" active={direction === 'above'} onPress={() => setDirection('above')} />
            <DirectionBtn label="Below" active={direction === 'below'} onPress={() => setDirection('below')} />
          </View>

          {liveProb != null && (
            <View style={styles.liveProbRow}>
              <Text style={styles.liveProbLabel}>Market gives this</Text>
              <Text
                style={[
                  styles.liveProbValue,
                  {
                    color:
                      liveProb >= 50 ? colors.up : liveProb >= 25 ? colors.warning : colors.down,
                  },
                ]}
              >
                {liveProb}%
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
            <Text style={styles.submitText}>Lock in</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.tip}>
          <Text style={styles.tipText}>👆 Tap any bar to set your call</Text>
        </View>
      )}
    </View>
  );
}

function DirectionBtn({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.directionBtn, active && styles.directionBtnActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.directionText, active && styles.directionTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.title,
    fontSize: 18,
    color: colors.text1,
  },
  subtitle: {
    ...typography.body,
    fontSize: 13,
    color: colors.text2,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  symbolRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  symbolPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  symbolPillText: {
    ...typography.bodyStrong,
    color: colors.text3,
  },
  chartWrap: {
    marginBottom: spacing.md,
  },
  empty: {
    ...typography.body,
    color: colors.text3,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  selectionPanel: {
    backgroundColor: colors.surface2,
    borderRadius: radii.sm,
    padding: spacing.md,
    gap: spacing.sm,
  },
  selectionLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionLabel: {
    ...typography.captionStrong,
    color: colors.text2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectionValue: {
    ...typography.bodyStrong,
    ...typography.numeric,
    color: colors.text1,
    textTransform: 'capitalize',
  },
  directionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  directionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  directionBtnActive: {
    backgroundColor: colors.accent + '22',
    borderColor: colors.accent,
  },
  directionText: {
    ...typography.bodyStrong,
    color: colors.text3,
  },
  directionTextActive: {
    color: colors.accent,
  },
  liveProbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  liveProbLabel: {
    ...typography.body,
    fontSize: 13,
    color: colors.text2,
  },
  liveProbValue: {
    ...typography.title,
    fontSize: 18,
    ...typography.numeric,
  },
  submitBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  submitText: {
    ...typography.bodyLg,
    fontFamily: typography.bodyStrong.fontFamily,
    color: colors.onAccent,
  },
  tip: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  tipText: {
    ...typography.body,
    fontSize: 13,
    color: colors.text3,
    fontStyle: 'italic',
  },
});
