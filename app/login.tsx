import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { FormInput, PrimaryButton, usePalette } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/constants/theme';

const schema = z.object({
  username: z.string().trim().min(1, 'Username or ID is required'),
  password: z.string().min(1, 'Password is required'),
});

type Form = z.infer<typeof schema>;

export default function Login() {
  const p = usePalette();
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const { setSession } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  });

  const submit = handleSubmit(async (v) => {
    setError('');
    try {
      const x = await authApi.login(v);
      await setSession(x.token, x.user);
      router.replace(x.user.role === 'ADMIN' ? '/dashboard' : '/home');
    } catch (e: any) {
      setError(
        e?.response?.data?.message || e?.message || 'Unable to sign in. Please check your credentials and try again.'
      );
    }
  });

  return (
    <KeyboardAvoidingView
      style={[s.page, { backgroundColor: p.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Presence */}
        <View style={s.brandHeader}>
          <View style={[s.brandMark, shadows.md]}>
            <Ionicons name="storefront" size={28} color="#FFFFFF" />
          </View>
          <View style={s.brandTitleRow}>
            <Text style={[s.brandName, { color: p.text }]}>Retail</Text>
            <Text style={[s.brandNameAccent, { color: colors.primary }]}>Flow</Text>
          </View>
          <View style={s.enterprisePill}>
            <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
            <Text style={s.enterprisePillText}>ENTERPRISE SALES PLATFORM</Text>
          </View>
        </View>

        {/* Main Sign-In Card */}
        <View style={[s.card, shadows.sm, { backgroundColor: p.card, borderColor: p.border }]}>
          <View style={s.cardHeader}>
            <Text style={[s.title, { color: p.text }]}>Sign In</Text>
            <Text style={[s.subtitle, { color: p.sub }]}>
              Enter your assigned workforce credentials
            </Text>
          </View>

          <Controller
            control={control}
            name="username"
            render={({ field: { value, onChange, onBlur } }) => (
              <FormInput
                label="Staff Username / ID"
                icon="person-outline"
                required
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
                placeholder="e.g. admin or sp_rajesh"
                error={errors.username?.message}
              />
            )}
          />

          <View style={{ position: 'relative' }}>
            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange, onBlur } }) => (
                <FormInput
                  label="Password"
                  icon="lock-closed-outline"
                  required
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!show}
                  placeholder="••••••••"
                  error={errors.password?.message}
                  style={{ paddingRight: 48 }}
                />
              )}
            />
            <Pressable
              onPress={() => setShow(!show)}
              style={s.eyeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={show ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={p.sub}
              />
            </Pressable>
          </View>

          {error ? (
            <View style={s.errorBanner}>
              <Ionicons name="warning-outline" size={16} color={colors.danger} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={{ marginTop: 6 }}>
            <PrimaryButton
              title="Authenticate"
              icon="arrow-forward"
              onPress={submit}
              loading={isSubmitting}
              size="lg"
            />
          </View>
        </View>

        {/* Security & Version Footnote */}
        <View style={s.securityFooter}>
          <Ionicons name="lock-closed" size={12} color={p.sub} />
          <Text style={[s.securityText, { color: p.sub }]}>
            End-to-end encrypted · ISO 27001 compliant
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandMark: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandNameAccent: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  enterprisePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginTop: 8,
  },
  enterprisePillText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  cardHeader: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 36,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.xs,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xxl,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
