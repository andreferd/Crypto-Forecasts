import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing, radii, typography } from '../theme';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  sublabel?: string;
}

interface Props<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
            {opt.sublabel && (
              <Text style={[styles.sublabel, active && styles.sublabelActive]}>
                {opt.sublabel}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    padding: 3,
    gap: 2,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  segmentActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    ...typography.captionStrong,
    fontSize: 12,
    color: colors.text3,
  },
  labelActive: {
    color: colors.text1,
  },
  sublabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text3,
    marginTop: 1,
  },
  sublabelActive: {
    color: colors.text2,
  },
});
