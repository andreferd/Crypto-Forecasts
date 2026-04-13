import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../constants/colors';

export function SourceAttribution() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Powered by Kalshi prediction markets
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  text: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});
