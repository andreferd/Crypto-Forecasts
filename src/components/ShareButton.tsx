import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { ForecastSeries } from '../types/market';
import { shareForcast } from '../utils/shareCard';

interface ShareButtonProps {
  symbol: string;
  name: string;
  forecasts: ForecastSeries[];
  spotPrice?: number | null;
}

export function ShareButton({ symbol, name, forecasts, spotPrice }: ShareButtonProps) {
  const handlePress = () => {
    shareForcast(symbol, name, forecasts, spotPrice);
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress} activeOpacity={0.7}>
      <Text style={styles.icon}>{'↗'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
});
