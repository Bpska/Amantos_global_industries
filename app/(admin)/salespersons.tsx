import { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { adminApi } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { normalizePage, apiError, money } from '@/utils/format';
import { AppHeader } from '@/components/AppHeader';
import { EmptyState, FormInput, MoneyText, PrimaryButton, Skeleton, usePalette } from '@/components/ui';
import { colors, shadows } from '@/constants/theme';
import type { User } from '@/types';

const generate = () =>
  `Rf@${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 90 + 10)}`;

export default function Salespersons() {
  const p = usePalette();
  const qc = useQueryClient();
  const { logout } = useAuthStore();

  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogout = () => {
    const doLogout = async () => {
      await logout();
      router.replace('/login');
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to log out of the admin panel?')) {
        void doLogout();
      }
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: doLogout },
    ]);
  };

  const q = useQuery({
    queryKey: ['salespersons'],
    queryFn: async () => normalizePage<User>(await adminApi.salespersons()),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['salespersons'] });

  const save = useMutation({
    mutationFn: () =>
      edit
        ? adminApi.updateSalesperson(edit.id, { name, phone, username })
        : adminApi.createSalesperson({ name, phone, username, password }),
    onSuccess: () => {
      close();
      refresh();
      Alert.alert('Saved', edit ? 'Sales representative profile updated.' : 'New field representative created.');
    },
    onError: (e) => Alert.alert('Could not save', apiError(e)),
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      adminApi.updateSalesperson(id, { active }),
    onSuccess: refresh,
    onError: (e) => Alert.alert('Error', apiError(e)),
  });

  const open = (x?: User) => {
    setEdit(x || null);
    setName(x?.name || '');
    setPhone(x?.phone || '');
    setUsername(x?.username || '');
    setPassword('');
    setShow(true);
  };

  const close = () => setShow(false);

  const reset = (x: User) => {
    const pass = generate();
    Alert.alert('Reset Password', `A new temporary password will be assigned:\n\n${pass}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Assign & Copy',
        onPress: async () => {
          try {
            await adminApi.resetPassword(x.id, pass);
            await Clipboard.setStringAsync(pass);
            Alert.alert('Password Assigned', 'Temporary password copied to clipboard. Share securely with representative.');
          } catch (e) {
            Alert.alert('Error', apiError(e));
          }
        },
      },
    ]);
  };

  if (q.isLoading) return <Skeleton />;

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <AppHeader
        title="Field Sales Team"
        subtitle={`${q.data?.data?.length || 0} representatives deployed`}
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable onPress={() => open()} style={[s.addBtn, shadows.sm]}>
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
            <Pressable
              onPress={handleLogout}
              style={[s.logoutHeaderBtn, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}
            >
              <Ionicons name="log-out-outline" size={16} color={colors.danger} />
            </Pressable>
          </View>
        }
      />

      <FlatList
        data={q.data?.data || []}
        keyExtractor={(x) => x.id}
        refreshing={q.isRefetching}
        onRefresh={q.refetch}
        ListEmptyComponent={
          <EmptyState
            title="No Field Representatives"
            message="Tap '+' above to onboard your first field sales agent."
            icon="people-outline"
          />
        }
        renderItem={({ item: x }) => (
          <View style={[s.card, { backgroundColor: p.card, borderColor: p.border }, shadows.xs]}>
            <View style={s.cardTop}>
              <View style={s.repAvatar}>
                <Text style={s.repAvatarText}>
                  {(x.name || x.username || 'S')[0].toUpperCase()}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[s.repName, { color: p.text }]}>{x.name}</Text>
                  {x.active !== false && (
                    <View style={s.verifiedPill}>
                      <Text style={s.verifiedPillText}>ACTIVE</Text>
                    </View>
                  )}
                </View>
                <Text style={[s.repHandle, { color: p.sub }]}>
                  @{x.username} {x.phone ? `· +91 ${x.phone}` : ''}
                </Text>
              </View>

              <View style={s.switchCol}>
                <Switch
                  value={x.active !== false}
                  onValueChange={(active) => toggle.mutate({ id: x.id, active })}
                  trackColor={{ true: colors.primary, false: '#CBD5E1' }}
                />
              </View>
            </View>

            {/* Performance Ledger Summary Strip */}
            <View style={[s.metricsStrip, { backgroundColor: p.bg, borderColor: p.border }]}>
              <MetricCell label="Stores" value={String((x as any).totalShops || 0)} />
              <MetricCell label="Gross Invoiced" value={money((x as any).totalSales || 0)} />
              <MetricCell label="Collected" value={money((x as any).totalCollected || 0)} color={colors.settled} />
              <MetricCell label="Pending BAKI" value={money((x as any).totalBaki || 0)} color={colors.baki} />
            </View>

            {/* Admin Controls */}
            <View style={[s.controlsRow, { borderTopColor: p.border }]}>
              <Pressable onPress={() => open(x)} style={s.controlAction}>
                <Ionicons name="create-outline" size={15} color={colors.primary} />
                <Text style={s.controlActionText}>Edit Profile</Text>
              </Pressable>

              <View style={[s.controlDivider, { backgroundColor: p.border }]} />

              <Pressable onPress={() => reset(x)} style={s.controlAction}>
                <Ionicons name="key-outline" size={15} color={colors.primary} />
                <Text style={s.controlActionText}>Reset Credentials</Text>
              </Pressable>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      {/* Create / Edit Modal Sheet */}
      <Modal visible={show} transparent animationType="slide" onRequestClose={close}>
        <Pressable style={s.modalOverlay} onPress={close}>
          <Pressable style={[s.modalSheet, { backgroundColor: p.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={s.dragHandle} />
            <Text style={[s.modalTitle, { color: p.text }]}>
              {edit ? 'Update Field Agent Profile' : 'Onboard Sales Representative'}
            </Text>
            <Text style={[s.modalSub, { color: p.sub }]}>
              {edit ? 'Modify representative contact and identity details' : 'Create new authentication credentials and route assignment'}
            </Text>

            <FormInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Ramesh Patil"
              required
            />
            <FormInput
              label="Contact Number (10 Digits)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="9876543210"
              required
            />
            <FormInput
              label="User ID / Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="sp_ramesh"
              required
            />

            {!edit && (
              <>
                <FormInput
                  label="Initial Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  required
                />
                <View style={s.passwordTools}>
                  <Pressable
                    onPress={() => setPassword(generate())}
                    style={[s.genPassBtn, { borderColor: p.border, backgroundColor: p.bg }]}
                  >
                    <Ionicons name="flash-outline" size={13} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Generate Password</Text>
                  </Pressable>
                  <Pressable
                    disabled={!password}
                    onPress={async () => {
                      await Clipboard.setStringAsync(password);
                      Alert.alert('Copied', 'Temporary password copied to clipboard.');
                    }}
                    style={[s.genPassBtn, { borderColor: p.border, backgroundColor: p.bg }]}
                  >
                    <Ionicons name="copy-outline" size={13} color={p.text} />
                    <Text style={{ color: p.text, fontSize: 12, fontWeight: '700' }}>Copy</Text>
                  </Pressable>
                </View>
              </>
            )}

            <View style={{ marginTop: 10 }}>
              <PrimaryButton
                title={edit ? 'Save Changes' : 'Create Field Account'}
                icon="checkmark-circle"
                size="lg"
                loading={save.isPending}
                disabled={
                  !name.trim() ||
                  phone.trim().length !== 10 ||
                  !username.trim() ||
                  (!edit && password.length < 6)
                }
                onPress={() => save.mutate()}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function MetricCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={s.metricCell}>
      <Text style={s.metricCellLabel}>{label}</Text>
      <Text numberOfLines={1} style={[s.metricCellValue, color ? { color } : null]}>
        {value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  repAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  repAvatarText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 18,
  },
  repName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  verifiedPill: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedPillText: {
    color: colors.settled,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  repHandle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  switchCol: {
    alignItems: 'center',
  },
  metricsStrip: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
  },
  metricCellLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  metricCellValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  controlsRow: {
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  controlAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  controlActionText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  controlDivider: {
    width: 1,
    height: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  modalSheet: {
    padding: 22,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  modalSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 16,
  },
  passwordTools: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
    marginBottom: 16,
    gap: 8,
  },
  genPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
});
