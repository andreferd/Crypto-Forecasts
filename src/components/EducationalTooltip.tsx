import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';

const STORAGE_KEY = '@crypto_forecasts_edu_seen';

export function EducationalTooltip() {
  const [visible, setVisible] = useState(false);
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (!val) {
        setVisible(true);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [opacity]);

  const dismiss = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      AsyncStorage.setItem(STORAGE_KEY, '1');
    });
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome to Crypto Forecasts!</Text>
        <Text style={styles.body}>
          This app shows probability distributions from Kalshi prediction markets.
          Each bar represents the market's estimated probability that a crypto asset
          will end within that price range. Tap any bar to see details, or scrub
          the chart to explore historical trends.
        </Text>
        <TouchableOpacity style={styles.button} onPress={dismiss} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Got it!</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    zIndex: 100,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: 340,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.accentDim,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.accent,
  },
});
