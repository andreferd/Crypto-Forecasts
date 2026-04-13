import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { TOKENS } from '../constants/tokens';
import { ForecastRow } from './ForecastRow';
import { TrendArrow } from './TrendArrow';
import { LoadingSkeleton } from './LoadingSkeleton';
import { CryptoForecast } from '../types/market';

interface CryptoCardProps {
  forecast: CryptoForecast;
  onPress: () => void;
  trend?: { direction: 'up' | 'down' | 'flat'; changePercent: number } | null;
  animationDelay?: number;
}

export function CryptoCard({ forecast, onPress, trend, animationDelay = 0 }: CryptoCardProps) {
  const token = TOKENS[forecast.symbol];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, animationDelay);
    return () => clearTimeout(timer);
  }, [fadeAnim, slideAnim, animationDelay]);

  if (forecast.isLoading) {
    return <LoadingSkeleton />;
  }

  if (forecast.isError || forecast.forecasts.length === 0) {
    return (
      <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: token?.color ?? Colors.accent }]}>
            <Text style={styles.icon}>{token?.icon ?? '?'}</Text>
          </View>
          <View>
            <Text style={styles.symbol}>{forecast.symbol}</Text>
            <Text style={styles.name}>{token?.name ?? forecast.symbol}</Text>
          </View>
        </View>
        <Text style={styles.errorText}>Unable to load forecast data</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: token?.color ?? Colors.accent }]}>
            <Text style={styles.icon}>{token?.icon ?? '?'}</Text>
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.headerTop}>
              <Text style={styles.symbol}>{forecast.symbol}</Text>
              {trend && (
                <TrendArrow direction={trend.direction} changePercent={trend.changePercent} />
              )}
            </View>
            <Text style={styles.name}>{token?.name ?? forecast.symbol}</Text>
          </View>
          <Text style={styles.chevron}>{'>'}</Text>
        </View>

        <View style={styles.divider} />

        {forecast.forecasts.map((series) => {
          if (!series.mostLikelyBracket) return null;
          return (
            <ForecastRow
              key={series.type}
              label={series.label}
              value={series.mostLikelyBracket.displayRange}
              probability={series.mostLikelyBracket.probability}
            />
          );
        })}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  symbol: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  name: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  chevron: {
    fontSize: 18,
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  errorText: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
});
