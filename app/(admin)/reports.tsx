import { useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { adminApi } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { normalizePage, dateDay, apiError, money } from '@/utils/format';
import { AppHeader } from '@/components/AppHeader';
import {
  EmptyState,
  MoneyText,
  PrimaryButton,
  Skeleton,
  StatusChip,
  usePalette,
} from '@/components/ui';
import { colors, shadows } from '@/constants/theme';
import type { Order } from '@/types';

type PresetType = 'today' | '7days' | 'month';

export default function Reports() {
  const p = usePalette();
  const { logout } = useAuthStore();
  const [activePreset, setActivePreset] = useState<PresetType>('month');
  const [now] = useState(new Date());
  const [from, setFrom] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [to, setTo] = useState(now);
  const [picker, setPicker] = useState<'from' | 'to' | null>(null);

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
    Alert.alert('Sign Out', 'Are you sure you want to log out of the admin panel?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: doLogout },
    ]);
  };

  const setRangePreset = (type: PresetType) => {
    setActivePreset(type);
    const today = new Date();
    if (type === 'today') {
      setFrom(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
      setTo(today);
    } else if (type === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      setFrom(d);
      setTo(today);
    } else if (type === 'month') {
      setFrom(new Date(today.getFullYear(), today.getMonth(), 1));
      setTo(today);
    }
  };

  const params = { from: from.toISOString(), to: to.toISOString() };
  const q = useQuery({
    queryKey: ['admin-orders', params.from, params.to],
    queryFn: async () => normalizePage<Order>(await adminApi.orders({ ...params, limit: 100 })),
  });

  const orders: Order[] = q.data?.data || [];
  const total = orders.reduce((a, x) => a + Number(x.totalAmount || 0), 0);
  const paid = orders.reduce((a, x) => a + Number(x.paidAmount || 0), 0);
  const baki = orders.reduce((a, x) => a + Number(x.baki || 0), 0);
  const collectionRate = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 100;

  const exportCsv = async () => {
    try {
      const csv = await adminApi.exportCsv(params);
      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute(
          'download',
          `retailflow-audit-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      const uri = `${FileSystem.cacheDirectory}retailflow-audit-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}.csv`;
      await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device');
      await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Export RetailFlow Audit CSV' });
    } catch (e) {
      Alert.alert('Export failed', apiError(e));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <AppHeader
        title="Financial Analytics"
        subtitle="Ledger settlement & sales audit reports"
        right={
          <Pressable
            onPress={handleLogout}
            style={[s.logoutHeaderBtn, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}
          >
            <Ionicons name="log-out-outline" size={16} color={colors.danger} />
            <Text style={s.logoutHeaderText}>Logout</Text>
          </Pressable>
        }
      />

      {/* Preset range chips */}
      <View style={s.presetRow}>
        {(
          [
            { key: 'today', label: 'Today' },
            { key: '7days', label: 'Last 7 Days' },
            { key: 'month', label: 'This Month' },
          ] as const
        ).map((item) => {
          const active = activePreset === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setRangePreset(item.key)}
              style={[
                s.presetChip,
                {
                  backgroundColor: active ? colors.primary : p.card,
                  borderColor: active ? colors.primary : p.border,
                },
              ]}
            >
              <Text style={[s.presetChipText, { color: active ? '#fff' : p.text, fontWeight: active ? '800' : '600' }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Date Pickers */}
      <View style={s.rangeRow}>
        {(['from', 'to'] as const).map((k) => (
          <Pressable
            key={k}
            onPress={() => setPicker(k)}
            style={[s.dateBox, { backgroundColor: p.card, borderColor: p.border }, shadows.xs]}
          >
            <Ionicons name="calendar-outline" color={colors.primary} size={16} />
            <View>
              <Text style={{ fontSize: 9, color: p.sub, fontWeight: '800', letterSpacing: 0.5 }}>
                {k === 'from' ? 'START DATE' : 'END DATE'}
              </Text>
              <Text style={{ color: p.text, fontWeight: '700', fontSize: 13, marginTop: 1 }}>
                {dateDay(k === 'from' ? from : to).split(',')[0]}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      {picker && (
        <DateTimePicker
          value={picker === 'from' ? from : to}
          maximumDate={now}
          onChange={(_, d) => {
            if (d) picker === 'from' ? setFrom(d) : setTo(d);
            setPicker(null);
          }}
        />
      )}

      {/* Executive Financial Summary Card */}
      <View style={[s.summaryHero, { backgroundColor: p.card, borderColor: p.border }, shadows.sm]}>
        <View style={s.summaryHeroTop}>
          <View>
            <Text style={[s.summaryLabel, { color: p.sub }]}>PERIOD GROSS BILLED</Text>
            <Text style={[s.summaryHeroAmount, { color: p.text }]}>{money(total)}</Text>
          </View>
          <View style={[s.ratioBadge, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}>
            <Ionicons name="shield-checkmark" size={13} color={colors.settled} />
            <Text style={s.ratioBadgeText}>{collectionRate}% Settled</Text>
          </View>
        </View>

        {/* 3-Column Breakdown */}
        <View style={[s.summaryLedgerStrip, { backgroundColor: p.bg, borderColor: p.border }]}>
          <View style={s.summaryCol}>
            <Text style={s.summaryColLabel}>ORDERS</Text>
            <Text style={[s.summaryColVal, { color: p.text }]}>{orders.length}</Text>
          </View>
          <View style={[s.summaryColDivider, { backgroundColor: p.border }]} />
          <View style={s.summaryCol}>
            <Text style={s.summaryColLabel}>COLLECTED</Text>
            <Text style={[s.summaryColVal, { color: colors.settled }]}>{money(paid)}</Text>
          </View>
          <View style={[s.summaryColDivider, { backgroundColor: p.border }]} />
          <View style={s.summaryCol}>
            <Text style={[s.summaryColLabel, { color: colors.baki }]}>OUTSTANDING BAKI</Text>
            <MoneyText value={baki} baki style={{ fontSize: 13 }} />
          </View>
        </View>

        {/* Progress Bar */}
        <View style={s.progressRow}>
          <View style={[s.track, { backgroundColor: '#E2E8F0' }]}>
            <View
              style={[
                s.fill,
                {
                  width: `${collectionRate}%`,
                  backgroundColor: collectionRate >= 90 ? colors.settled : colors.primary,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Export CSV Button */}
      <View style={s.exportWrap}>
        <PrimaryButton
          title="Export CSV Audit Ledger"
          icon="download-outline"
          variant="outline"
          onPress={exportCsv}
        />
      </View>

      {/* Section Header */}
      <View style={s.ordersHeader}>
        <Text style={[s.ordersTitle, { color: p.text }]}>Audit Transactions</Text>
        <Text style={[s.ordersCount, { color: p.sub }]}>{orders.length} Dispatches</Text>
      </View>

      {/* Orders List */}
      {q.isLoading ? (
        <Skeleton />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(x) => x.id}
          ListEmptyComponent={
            <EmptyState
              title="No transactions found"
              message="No order dispatches match the selected date range."
              icon="receipt-outline"
            />
          }
          renderItem={({ item: x, index }) => (
            <View style={[s.orderRow, { backgroundColor: p.card, borderColor: p.border }, shadows.xs]}>
              <View style={s.orderIconSquare}>
                <Ionicons name="cube-outline" size={18} color={colors.primary} />
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[s.orderIndex, { color: colors.primary }]}>#{orders.length - index}</Text>
                  <Text numberOfLines={1} style={[s.orderProduct, { color: p.text }]}>{x.product}</Text>
                </View>
                <Text style={[s.orderMeta, { color: p.sub }]}>
                  {dateDay(x.date)} · {x.quantity} pcs @ ₹{x.unitPrice}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end', gap: 3 }}>
                <Text style={[s.orderTotalText, { color: p.text }]}>{money(x.totalAmount)}</Text>
                <StatusChip status={x.baki === 0 ? 'PAID' : (x.paidAmount > 0 ? 'PARTIAL' : 'UNPAID')} />
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  logoutHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  logoutHeaderText: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 12,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 12,
    letterSpacing: 0.1,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  dateBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  summaryHero: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  summaryHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summaryHeroAmount: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  ratioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  ratioBadgeText: {
    color: colors.settled,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  summaryLedgerStrip: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryColDivider: {
    width: 1,
    height: 24,
  },
  summaryColLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  summaryColVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressRow: {
    marginTop: -4,
  },
  track: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  exportWrap: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  ordersTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  ordersCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderRow: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderIndex: {
    fontSize: 11,
    fontWeight: '800',
  },
  orderProduct: {
    fontSize: 14,
    fontWeight: '800',
  },
  orderMeta: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  orderTotalText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
