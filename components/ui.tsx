import React, { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing } from '@/constants/theme';
import { money } from '@/utils/format';
import type { PaymentStatus } from '@/types';
import { useThemeStore } from '@/store/theme';

export const usePalette = () => {
  const theme = useThemeStore((s) => s.theme);
  const dark = theme === 'dark';
  return {
    dark,
    theme,
    bg: dark ? colors.darkBg : '#FFFFFF',
    card: dark ? colors.darkCard : '#FFFFFF',
    cardSecondary: dark ? '#1A2338' : '#F8FAFC',
    text: dark ? '#F8FAFC' : '#0F172A',
    textSecondary: dark ? '#94A3B8' : '#334155',
    sub: dark ? '#94A3B8' : '#64748B',
    border: dark ? '#1E293B' : '#E2E8F0',
    borderSubtle: dark ? '#1E293B' : '#F1F5F9',
    primary: colors.primary,
    primarySoft: dark ? '#1E293B' : '#EFF6FF',
  };
};

export function ThemeToggleButton() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <Pressable
      onPress={toggleTheme}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
        borderWidth: 1,
        borderColor: isDark ? '#334155' : '#E2E8F0',
      }}
      accessibilityLabel="Toggle Theme"
    >
      <Ionicons
        name={isDark ? 'sunny' : 'moon'}
        size={14}
        color={isDark ? '#FBBF24' : '#1D4ED8'}
      />
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: isDark ? '#F8FAFC' : '#0F172A',
        }}
      >
        {isDark ? 'Dark' : 'White'}
      </Text>
    </Pressable>
  );
}

export function Screen({ children, style }: { children: ReactNode; style?: any }) {
  const p = usePalette();
  return <View style={[s.screen, { backgroundColor: p.bg }, style]}>{children}</View>;
}

export function Card({
  children,
  style,
  noPadding = false,
}: {
  children: ReactNode;
  style?: any;
  noPadding?: boolean;
}) {
  const p = usePalette();
  return (
    <View
      style={[
        s.cardContainer,
        shadows.sm,
        {
          backgroundColor: p.card,
          borderColor: p.border,
          padding: noPadding ? 0 : spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function MoneyText({
  value,
  baki = false,
  style,
}: {
  value: number | string | undefined;
  baki?: boolean;
  style?: any;
}) {
  const p = usePalette();
  const num = Number(value) || 0;
  const isRed = baki && num > 0;
  return (
    <Text
      style={[
        s.money,
        { color: isRed ? colors.danger : p.text },
        style,
      ]}
    >
      {money(value)}
    </Text>
  );
}

export function StatusChip({ status }: { status: PaymentStatus | string }) {
  const sUpper = (status || 'UNPAID').toUpperCase();

  let bg = colors.dangerSoft;
  let text = colors.danger;
  let border = colors.dangerBorder;
  let label = 'Unpaid';

  if (sUpper === 'PAID') {
    bg = colors.successSoft;
    text = colors.successDark;
    border = colors.successBorder;
    label = 'Settled';
  } else if (sUpper === 'PARTIAL') {
    bg = colors.warningSoft;
    text = colors.warningDark;
    border = colors.warningBorder;
    label = 'Partial';
  }

  return (
    <View style={[s.chip, { backgroundColor: bg, borderColor: border }]}>
      <View style={[s.chipDot, { backgroundColor: text }]} />
      <Text style={[s.chipText, { color: text }]}>{label}</Text>
    </View>
  );
}

export function StatCard({
  label,
  value,
  baki = false,
  icon,
  sublabel,
}: {
  label: string;
  value: number | string;
  baki?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  sublabel?: string;
}) {
  const p = usePalette();
  const isDanger = baki && Number(value) > 0;

  return (
    <View
      style={[
        s.stat,
        shadows.sm,
        {
          backgroundColor: p.card,
          borderColor: isDanger ? colors.dangerBorder : p.border,
        },
      ]}
    >
      <View style={s.statTopRow}>
        <Text style={[s.statLabel, { color: p.sub }]} numberOfLines={1}>
          {label}
        </Text>
        {icon && (
          <View
            style={[
              s.statIconWrap,
              {
                backgroundColor: isDanger ? colors.dangerSoft : p.primarySoft,
              },
            ]}
          >
            <Ionicons
              name={icon}
              size={15}
              color={isDanger ? colors.danger : colors.primary}
            />
          </View>
        )}
      </View>
      <MoneyText
        value={value}
        baki={baki}
        style={[s.statValue, { color: isDanger ? colors.danger : p.text }]}
      />
      {sublabel ? (
        <Text style={[s.statSublabel, { color: p.sub }]}>{sublabel}</Text>
      ) : null}
    </View>
  );
}

export function FormInput({
  label,
  error,
  required,
  icon,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
  required?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const p = usePalette();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={s.field}>
      <Text style={[s.label, { color: p.textSecondary }]}>
        {label}
        {required && <Text style={{ color: colors.danger, fontWeight: '700' }}> *</Text>}
      </Text>
      <View
        style={[
          s.inputWrapper,
          {
            backgroundColor: isFocused ? p.card : p.cardSecondary,
            borderColor: error
              ? colors.danger
              : isFocused
              ? colors.primary
              : p.border,
            borderWidth: isFocused ? 1.5 : 1,
          },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={isFocused ? colors.primary : p.sub}
            style={s.inputIcon}
          />
        )}
        <TextInput
          placeholderTextColor={p.sub}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
          style={[
            s.input,
            { color: p.text },
            icon ? { paddingLeft: 4 } : undefined,
            props.style,
          ]}
        />
      </View>
      {error && (
        <View style={s.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.danger} />
          <Text style={s.error}>{error}</Text>
        </View>
      )}
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
  size = 'md',
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md' | 'lg';
}) {
  let bg = colors.primary;
  let text = '#FFFFFF';
  let border = colors.primary;

  if (variant === 'secondary') {
    bg = colors.primarySoft;
    text = colors.primary;
    border = colors.primaryBorder;
  } else if (variant === 'outline') {
    bg = 'transparent';
    text = colors.primary;
    border = colors.border;
  } else if (variant === 'danger') {
    bg = colors.danger;
    text = '#FFFFFF';
    border = colors.danger;
  } else if (variant === 'ghost') {
    bg = 'transparent';
    text = colors.inkSecondary;
    border = 'transparent';
  }

  const height = size === 'sm' ? 38 : size === 'lg' ? 52 : 46;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 15 : 14;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        variant === 'primary' && !disabled ? shadows.sm : undefined,
        {
          backgroundColor: bg,
          borderColor: border,
          height,
          opacity: pressed ? 0.8 : disabled ? 0.5 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={text} size="small" />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={fontSize + 3}
              color={text}
              style={{ marginRight: 6 }}
            />
          )}
          <Text style={[s.buttonText, { color: text, fontSize }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function EmptyState({
  title = 'No records found',
  message = 'New entries will be displayed here once recorded.',
  icon = 'file-tray-outline',
  actionTitle,
  onAction,
}: {
  title?: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionTitle?: string;
  onAction?: () => void;
}) {
  const p = usePalette();
  return (
    <View style={s.empty}>
      <View style={[s.emptyIconContainer, { backgroundColor: p.primarySoft }]}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <Text style={[s.emptyTitle, { color: p.text }]}>{title}</Text>
      <Text style={[s.emptyDesc, { color: p.sub }]}>{message}</Text>
      {actionTitle && onAction && (
        <View style={{ marginTop: 14 }}>
          <PrimaryButton title={actionTitle} onPress={onAction} size="sm" />
        </View>
      )}
    </View>
  );
}

export function Skeleton() {
  const p = usePalette();
  return (
    <View style={{ gap: 12, padding: 16 }}>
      {[1, 2, 3, 4].map((x) => (
        <View
          key={x}
          style={[
            s.skeletonCard,
            { backgroundColor: p.card, borderColor: p.border },
          ]}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  cardContainer: {
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  money: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: 5,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  stat: {
    width: '48%',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 94,
  },
  statTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    flex: 1,
  },
  statIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statSublabel: {
    fontSize: 11,
    marginTop: 3,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  inputIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    minHeight: 44,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  error: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '500',
  },
  button: {
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  buttonText: {
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  empty: {
    padding: 36,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 240,
  },
  skeletonCard: {
    height: 90,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
