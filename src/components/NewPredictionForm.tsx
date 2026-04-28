import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing, radii, typography } from '../theme';
import { TOKENS } from '../constants/tokens';
import { useForecast } from '../hooks/useForecast';
import { computeMarketProbForTarget } from '../utils/predictionScoring';
import { DistributionCurve } from './DistributionCurve';
import { PriceTape } from './PriceTape';
import { PriceBracket } from '../types/market';

interface Props {
  onSubmit: (symbol: string, targetPrice: number, direction: 'above' | 'below') => void;
  initialSymbol?: string;
}

const SYMBOLS = ['BTC', 'ETH', 'SOL'];
const TAPE_WIDTH = 300;

function formatPrice(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(v).toLocaleString()}`;
}

function bracketMidpoint(b: PriceBracket): number {
  if (b.floorStrike != null && b.capStrike != null) return (b.floorStrike + b.capStrike) / 2;
  if (b.floorStrike != null) return b.floorStrike * 1.1;
  if (b.capStrike != null) return b.capStrike * 0.9;
  return 0;
}

function pickStep(span: number): number {
  // Aim for ~150–250 ticks across the domain.
  if (span >= 100_000) return 1000;
  if (span >= 10_000) return 500;
  if (span >= 1_000) return 50;
  if (span >= 100) return 10;
  return 1;
}

function findBracket(brackets: PriceBracket[], price: number): PriceBracket | null {
  for (const b of brackets) {
    const floor = b.floorStrike ?? -Infinity;
    const cap = b.capStrike ?? Infinity;
    if (price >= floor && price <= cap) return b;
  }
  return null;
}

export function NewPredictionForm({ onSubmit, initialSymbol }: Props) {
  const [symbol, setSymbol] = useState(initialSymbol ?? 'BTC');
  const [target, setTarget] = useState<number | null>(null);
  const [direction, setDirection] = useState<'above' | 'below'>('above');

  const forecast = useForecast(symbol);
  const eoy = forecast.forecasts.find((f) => f.type === 'eoy');
  const brackets = eoy?.brackets ?? [];

  const domain = useMemo(() => {
    const sided = brackets.filter((b) => b.floorStrike != null || b.capStrike != null);
    if (sided.length === 0) return null;
    const floors = sided.map((b) => b.floorStrike ?? b.capStrike! * 0.9);
    const caps = sided.map((b) => b.capStrike ?? b.floorStrike! * 1.1);
    const min = Math.min(...floors);
    const max = Math.max(...caps);
    const step = pickStep(max - min);
    // Round min/max down/up to step boundary so ticks align cleanly.
    const minSnap = Math.floor(min / step) * step;
    const maxSnap = Math.ceil(max / step) * step;
    return { min: minSnap, max: maxSnap, step };
  }, [brackets]);

  // Default target = most-likely bracket midpoint, snapped to step
  useEffect(() => {
    if (!domain || brackets.length === 0) return;
    if (target != null && target >= domain.min && target <= domain.max) return;
    const mostLikely = eoy?.mostLikelyBracket;
    const seed = mostLikely ? bracketMidpoint(mostLikely) : (domain.min + domain.max) / 2;
    const snapped = Math.round(seed / domain.step) * domain.step;
    setTarget(snapped);
  }, [domain, brackets, eoy, target]);

  // Reset when symbol changes
  useEffect(() => {
    setTarget(null);
  }, [symbol]);

  const liveProb = useMemo(() => {
    if (target == null || brackets.length === 0) return null;
    return computeMarketProbForTarget(brackets, target, direction);
  }, [brackets, target, direction]);

  const snappedBracket = useMemo(() => {
    if (target == null) return null;
    return findBracket(brackets, target);
  }, [brackets, target]);

  const handleSubmit = () => {
    if (target == null) return;
    onSubmit(symbol, target, direction);
  };

  const brandColor = TOKENS[symbol]?.color ?? colors.accent;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Make a call</Text>
      <Text style={styles.subtitle}>
        Scroll the tape to set your end-of-year price.
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
        {brackets.length === 0 || !domain ? (
          <Text style={styles.empty}>Loading {symbol} brackets…</Text>
        ) : (
          <>
            <DistributionCurve
              brackets={brackets}
              accentColor={brandColor}
              height={120}
              width={TAPE_WIDTH}
              showAxis={false}
            />
            <PriceTape
              min={domain.min}
              max={domain.max}
              step={domain.step}
              value={target ?? domain.min}
              onChange={setTarget}
              width={TAPE_WIDTH}
              accentColor={brandColor}
            />
          </>
        )}
      </View>

      {target != null && domain ? (
        <View style={styles.selectionPanel}>
          <View style={styles.selectionLine}>
            <Text style={styles.selectionLabel}>Your call</Text>
            <Text style={styles.selectionValue}>
              {symbol} {direction} {formatPrice(target)}
            </Text>
          </View>

          {snappedBracket && (
            <Text style={styles.snapHint}>
              Sits in the {snappedBracket.displayRange} bracket · market {snappedBracket.probability}%
            </Text>
          )}

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
      ) : null}
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
    ...typography.titleSm,
    color: colors.text1,
  },
  subtitle: {
    ...typography.bodySm,
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
    alignItems: 'center',
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
  },
  snapHint: {
    ...typography.caption,
    color: colors.text3,
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
    ...typography.bodySm,
    color: colors.text2,
  },
  liveProbValue: {
    ...typography.titleSm,
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
});
