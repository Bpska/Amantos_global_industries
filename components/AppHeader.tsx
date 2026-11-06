import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeToggleButton, usePalette } from './ui';
import { spacing } from '@/constants/theme';

export function AppHeader({
  title,
  subtitle,
  right,
  border = false,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  border?: boolean;
}) {
  const p = usePalette();

  return (
    <View
      style={[
        s.container,
        {
          backgroundColor: p.bg,
          borderBottomColor: p.borderSubtle,
          borderBottomWidth: border ? 1 : 0,
        },
      ]}
    >
      <View style={s.textContainer}>
        <Text style={[s.title, { color: p.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[s.subtitle, { color: p.sub }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={s.rightContainer}>
        {right}
        <ThemeToggleButton />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
