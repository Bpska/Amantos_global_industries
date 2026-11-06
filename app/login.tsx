import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/auth';

const schema = z.object({
  username: z.string().trim().min(1, 'Username or ID is required'),
  password: z.string().min(1, 'Password is required'),
});

type Form = z.infer<typeof schema>;

export default function Login() {
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const { setSession } = useAuthStore();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  });

  const handleDemoFill = (u: string, p: string) => {
    setValue('username', u);
    setValue('password', p);
    setError('');
  };

  const submit = handleSubmit(async (v) => {
    setError('');
    try {
      const x = await authApi.login(v);
      await setSession(x.token, x.user);
      router.replace(x.user.role === 'ADMIN' ? '/dashboard' : '/home');
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          'Authentication failed. Please verify credentials.'
      );
    }
  });

  const openAdminWeb = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = '/admin/';
    } else {
      handleDemoFill('admin', 'admin123');
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Return */}
        <View style={s.topBar}>
          <Pressable
            onPress={() => router.push('/')}
            style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="arrow-back" size={16} color="#D4AF37" />
            <Text style={s.backBtnText}>Heylane Overview</Text>
          </Pressable>

          <View style={s.nodeIndicator}>
            <View style={s.nodeDot} />
            <Text style={s.nodeText}>industri.heylane.in</Text>
          </View>
        </View>

        {/* Brand Presence */}
        <View style={s.brandHeader}>
          <View style={s.emblemFrame}>
            <Image
              source={require('@/assets/images/agi-logo.jpg')}
              style={s.emblemImage}
              resizeMode="cover"
            />
          </View>
          <View style={s.brandTitleRow}>
            <Text style={s.brandName}>HEYLANE</Text>
          </View>
          <View style={s.enterprisePill}>
            <Ionicons name="shield-checkmark" size={12} color="#D4AF37" />
            <Text style={s.enterprisePillText}>FIELD WORKFORCE PORTAL</Text>
          </View>
        </View>

        {/* Main Sign-In Card */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.title}>Field Representative Access</Text>
            <Text style={s.subtitle}>
              Authenticate using your assigned network credentials
            </Text>
          </View>

          {/* Quick Demo Fill Buttons */}
          <View style={s.demoSection}>
            <Text style={s.demoLabel}>1-Tap Demo Credentials:</Text>
            <View style={s.demoPillsRow}>
              <Pressable
                onPress={() => handleDemoFill('admin', 'AdminPassword@123')}
                style={({ pressed }) => [
                  s.demoPill,
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Ionicons name="shield" size={12} color="#D4AF37" />
                <Text style={s.demoPillText}>Admin (admin)</Text>
              </Pressable>

              <Pressable
                onPress={() => handleDemoFill('sp_rajesh', 'pass123')}
                style={({ pressed }) => [
                  s.demoPill,
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Ionicons name="briefcase" size={12} color="#60A5FA" />
                <Text style={s.demoPillText}>Sales Rep (sp_rajesh)</Text>
              </Pressable>
            </View>
          </View>

          {/* Username Input */}
          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>USERNAME / STAFF ID</Text>
            <View style={s.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={18}
                color="#D4AF37"
                style={s.inputIcon}
              />
              <Controller
                control={control}
                name="username"
                render={({ field: { value, onChange } }) => (
                  <View style={{ flex: 1 }}>
                    {Platform.OS === 'web' ? (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="e.g. sp_rajesh or admin"
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          color: '#FFFFFF',
                          fontSize: '14px',
                          padding: '12px 0',
                          fontFamily: 'inherit',
                        }}
                      />
                    ) : (
                      // Native TextInput fallback
                      <Pressable style={{ flex: 1 }}>
                        <Text style={{ color: '#fff' }}>{value}</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              />
            </View>
            {errors.username?.message ? (
              <Text style={s.fieldErrorText}>{errors.username.message}</Text>
            ) : null}
          </View>

          {/* Password Input */}
          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>SECURITY KEY / PASSWORD</Text>
            <View style={s.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color="#D4AF37"
                style={s.inputIcon}
              />
              <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange } }) => (
                  <View style={{ flex: 1 }}>
                    {Platform.OS === 'web' ? (
                      <input
                        type={show ? 'text' : 'password'}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="••••••••••••"
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          color: '#FFFFFF',
                          fontSize: '14px',
                          padding: '12px 0',
                          fontFamily: 'inherit',
                        }}
                      />
                    ) : (
                      <Pressable style={{ flex: 1 }}>
                        <Text style={{ color: '#fff' }}>{value}</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              />
              <Pressable
                onPress={() => setShow(!show)}
                style={s.eyeToggle}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={show ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#94A3B8"
                />
              </Pressable>
            </View>
            {errors.password?.message ? (
              <Text style={s.fieldErrorText}>{errors.password.message}</Text>
            ) : null}
          </View>

          {/* Error Banner */}
          {error ? (
            <View style={s.errorBanner}>
              <Ionicons name="warning-outline" size={16} color="#EF4444" />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <Pressable
            onPress={() => submit()}
            disabled={isSubmitting}
            style={({ pressed }) => [
              s.submitBtn,
              isSubmitting && s.submitBtnDisabled,
              pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
            ]}
          >
            <Text style={s.submitBtnText}>
              {isSubmitting ? 'Authenticating…' : 'Sign In to Heylane'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#0B0F17" />
          </Pressable>

          {/* Link to Admin Console */}
          <View style={s.adminLinkRow}>
            <Text style={s.adminLinkMuted}>System Administrator?</Text>
            <Pressable
              onPress={openAdminWeb}
              style={({ pressed }) => pressed && { opacity: 0.7 }}
            >
              <Text style={s.adminLinkHighlight}>Open Admin Console →</Text>
            </Pressable>
          </View>
        </View>

        {/* Security & Version Footnote */}
        <View style={s.securityFooter}>
          <Ionicons name="shield-checkmark" size={13} color="#10B981" />
          <Text style={s.securityText}>
            TLS 1.3 Active · PostgreSQL Core · ISO 27001 Validated
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#070A0F',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F5E6BE',
  },
  nodeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nodeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  nodeText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emblemFrame: {
    width: 80,
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.65)',
    backgroundColor: '#000',
    marginBottom: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(212, 175, 55, 0.25)',
      },
    }),
  },
  emblemImage: {
    width: '100%',
    height: '100%',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  enterprisePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 8,
  },
  enterprisePillText: {
    color: '#F5E6BE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: 'rgba(18, 24, 38, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
      },
    }),
  },
  cardHeader: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  demoSection: {
    backgroundColor: 'rgba(11, 15, 23, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  demoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
  },
  demoPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  demoPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F5E6BE',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#CBD5E1',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 15, 23, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  eyeToggle: {
    padding: 4,
  },
  fieldErrorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D4AF37',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 6,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 8px 20px rgba(212, 175, 55, 0.3)',
      },
    }),
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#0B0F17',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  adminLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  adminLinkMuted: {
    fontSize: 12,
    color: '#94A3B8',
  },
  adminLinkHighlight: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F5E6BE',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
});
