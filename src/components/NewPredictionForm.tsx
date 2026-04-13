import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { TOKENS } from '../constants/tokens';
import { useForecast } from '../hooks/useForecast';
import { computeMarketProbForTarget } from '../utils/predictionScoring';

interface Props {
  onSubmit: (symbol: string, targetPrice: number, direction: 'above' | 'below') => void;
  initialSymbol?: string;
}

const SYMBOLS = ['BTC', 'ETH', 'SOL'];

export function NewPredictionForm({ onSubmit, initialSymbol }: Props) {
  const [symbol, setSymbol] = useState(initialSymbol ?? 'BTC');
  const [priceText, setPriceText] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');

  const forecast = useForecast(symbol);
  const eoy = forecast.forecasts.find((f) => f.type === 'eoy');
  const brackets = eoy?.brackets ?? [];

  const targetPrice = parseFloat(priceText.replace(/[,$]/g, ''));
  const isValidPrice = !isNaN(targetPrice) && targetPrice > 0;

  const liveProb = useMemo(() => {
    if (!isValidPrice || brackets.length === 0) return null;
    return computeMarketProbForTarget(brackets, targetPrice, direction);
  }, [brackets, targetPrice, direction, isValidPrice]);

  const handleSubmit = () => {
    if (!isValidPrice) return;
    onSubmit(symbol, targetPrice, direction);
    setPriceText('');
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>New Prediction</Text>

      {/* Symbol picker */}
      <View style={styles.symbolRow}>
        {SYMBOLS.map((s) => {
          const token = TOKENS[s];
          const active = s === symbol;
          return (
            <TouchableOpacity
              key={s}
              style={[
                styles.symbolPill,
                active && { backgroundColor: (token?.color ?? Colors.accent) + '22', borderColor: token?.color ?? Colors.accent },
              ]}
              onPress={() => setSymbol(s)}
            >
              <Text
                style={[
                  styles.symbolPillText,
                  active && { color: token?.color ?? Colors.accent },
                ]}
              >
                {token?.icon ?? ''} {s}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Price input */}
      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>{symbol} price target:</Text>
        <TextInput
          style={styles.textInput}
          value={priceText}
          onChangeText={setPriceText}
          placeholder="e.g. 100000"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
        />
      </View>

      {/* Direction toggle */}
      <View style={styles.directionRow}>
        <TouchableOpacity
          style={[styles.directionBtn, direction === 'above' && styles.directionBtnActive]}
          onPress={() => setDirection('above')}
        >
          <Text style={[styles.directionText, direction === 'above' && styles.directionTextActive]}>
            Above
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.directionBtn, direction === 'below' && styles.directionBtnActive]}
          onPress={() => setDirection('below')}
        >
          <Text style={[styles.directionText, direction === 'below' && styles.directionTextActive]}>
            Below
          </Text>
        </TouchableOpacity>
      </View>

      {/* Live probability */}
      {liveProb != null && (
        <View style={styles.liveProbRow}>
          <Text style={styles.liveProbLabel}>Market gives this a</Text>
          <Text
            style={[
              styles.liveProbValue,
              { color: liveProb >= 50 ? Colors.success : liveProb >= 25 ? Colors.warning : Colors.error },
            ]}
          >
            {liveProb}% chance
          </Text>
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, !isValidPrice && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!isValidPrice}
      >
        <Text style={styles.submitText}>Make Prediction</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 14,
  },
  symbolRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  symbolPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  symbolPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  inputRow: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  directionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  directionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  directionBtnActive: {
    backgroundColor: Colors.accent + '22',
    borderColor: Colors.accent,
  },
  directionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  directionTextActive: {
    color: Colors.accent,
  },
  liveProbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 14,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
  },
  liveProbLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  liveProbValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
