import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { AppHeader } from '@/components/AppHeader';
import { PrimaryButton, usePalette } from '@/components/ui';
import { colors, shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function Profile() {
  const p = usePalette();
  const { theme, setTheme } = useThemeStore();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    const doLogout = async () => {
      await logout();
      router.replace('/login');
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to log out of RetailFlow?')) {
        void doLogout();
      }
      return;
    }

    Alert.alert('Confirm Sign Out', 'Are you sure you want to sign out of RetailFlow?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: doLogout },
    ]);
  };

  const initial = (user?.name?.[0] || user?.username?.[0] || 'U').toUpperCase();

  return (
    <ScrollView style={{ backgroundColor: p.bg }} contentContainerStyle={{ paddingBottom: 50 }}>
      <AppHeader title="Account Profile" subtitle="Field representative identity & display settings" />

      {/* Representative Profile Card */}
      <View style={[s.profileCard, { backgroundColor: p.card, borderColor: p.border }, shadows.sm]}>
        <View style={s.avatarWrap}>
          <View style={s.avatar}>
            <Text style={s.initialText}>{initial}</Text>
          </View>
          <View style={s.onlineDot} />
        </View>

        <Text style={[s.userName, { color: p.text }]}>{user?.name || user?.username}</Text>
        <Text style={[s.userHandle, { color: p.sub }]}>@{user?.username}</Text>

        {user?.phone ? (
          <View style={s.phoneRow}>
            <Ionicons name="call-outline" size={13} color={p.sub} />
            <Text style={{ color: p.sub, fontSize: 13, fontWeight: '500' }}>+91 {user.phone}</Text>
          </View>
        ) : null}

        <View style={s.badgeRow}>
          <View style={[s.roleBadge, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
            <Ionicons name="shield-checkmark" size={13} color={colors.primary} />
            <Text style={s.roleBadgeText}>FIELD SALES REPRESENTATIVE</Text>
          </View>
          <View style={[s.activeBadge, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}>
            <Text style={s.activeBadgeText}>ACTIVE ROUTE</Text>
          </View>
        </View>

        {/* System Diagnostics Strip */}
        <View style={[s.diagnosticsStrip, { backgroundColor: p.bg, borderColor: p.border }]}>
          <View style={s.diagCol}>
            <Text style={s.diagLabel}>APP RELEASE</Text>
            <Text style={[s.diagValue, { color: p.text }]}>v2.4.0 Prod</Text>
          </View>
          <View style={[s.diagDivider, { backgroundColor: p.border }]} />
          <View style={s.diagCol}>
            <Text style={s.diagLabel}>SERVER ENV</Text>
            <Text style={[s.diagValue, { color: colors.settled }]}>Connected</Text>
          </View>
          <View style={[s.diagDivider, { backgroundColor: p.border }]} />
          <View style={s.diagCol}>
            <Text style={s.diagLabel}>SECURITY</Text>
            <Text style={[s.diagValue, { color: p.text }]}>TLS 1.3</Text>
          </View>
        </View>
      </View>

      {/* Theme Appearance Card */}
      <View style={[s.card, { backgroundColor: p.card, borderColor: p.border }, shadows.xs]}>
        <View style={s.cardHeader}>
          <Ionicons name="color-palette-outline" size={18} color={colors.primary} />
          <Text style={[s.cardTitle, { color: p.text }]}>Display Theme (Both Options)</Text>
        </View>
        <Text style={{ fontSize: 13, color: p.sub, marginBottom: 12 }}>
          Choose your visual mode. White theme is the crisp default enterprise view.
        </Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            onPress={() => setTheme('light')}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: theme === 'light' ? colors.primary : p.border,
              backgroundColor: theme === 'light' ? (p.dark ? '#1E293B' : '#EFF6FF') : p.bg,
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Ionicons
              name="sunny"
              size={24}
              color={theme === 'light' ? colors.primary : p.sub}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '800',
                color: theme === 'light' ? colors.primary : p.text,
              }}
            >
              White Theme
            </Text>
            {theme === 'light' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>Active</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => setTheme('dark')}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: theme === 'dark' ? colors.primary : p.border,
              backgroundColor: theme === 'dark' ? (p.dark ? '#1E293B' : '#EFF6FF') : p.bg,
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Ionicons
              name="moon"
              size={24}
              color={theme === 'dark' ? '#FBBF24' : p.sub}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '800',
                color: theme === 'dark' ? (p.dark ? '#F8FAFC' : colors.primary) : p.text,
              }}
            >
              Dark Theme
            </Text>
            {theme === 'dark' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>Active</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Logout Action */}
      <View style={s.logoutWrap}>
        <PrimaryButton
          title="Sign Out of Session"
          variant="danger"
          icon="log-out-outline"
          onPress={handleLogout}
        />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 4,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.settled,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  userHandle: {
    fontSize: 13,
    fontWeight: '500',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  roleBadgeText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  activeBadgeText: {
    color: colors.settled,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  diagnosticsStrip: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  diagCol: {
    flex: 1,
    alignItems: 'center',
  },
  diagDivider: {
    width: 1,
    height: 24,
  },
  diagLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  diagValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 18,
    borderWidth: 1,
    borderRadius: 16,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  logoutWrap: {
    marginHorizontal: 16,
    marginTop: 8,
  },
});
