import React from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { adminApi } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { AppHeader } from '@/components/AppHeader';
import {
  EmptyState,
  MoneyText,
  Skeleton,
  usePalette,
} from '@/components/ui';
import { shortDate } from '@/utils/format';
import { colors, radius, shadows, spacing } from '@/constants/theme';

export default function Dashboard() {
  const p = usePalette();
  const { user, logout } = useAuthStore();
  const q = useQuery({ queryKey: ['admin-dashboard'], queryFn: adminApi.dashboard });
  const d = q.data;

  const handleLogout = () => {
    const doLogout = async () => {
      await logout();
      router.replace('/login');
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to log out?')) {
        void doLogout();
      }
      return;
    }

    Alert.alert('Sign Out', 'Are you sure you want to sign out of the management console?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: doLogout },
    ]);
  };

  if (q.isLoading) return <Skeleton />;

  const chart = d?.sevenDaySales || [];
  const totalSales = Number(d?.totalSales || 0);
  const totalCollected = Number(d?.totalCollected || 0);
  const totalBaki = Number(d?.totalBaki || 0);
  const collectionRatio = totalSales > 0 ? Math.min(100, Math.round((totalCollected / totalSales) * 100)) : 100;

  return (
    <ScrollView
      style={{ backgroundColor: p.bg }}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      refreshControl={
        <RefreshControl
          refreshing={q.isRefetching}
          onRefresh={() => {
            void q.refetch();
          }}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Executive App Bar */}
      <AppHeader
        title="Command Center"
        subtitle={`Admin: ${user?.name || 'Administrator'}`}
        right={
          <Pressable
            onPress={handleLogout}
            style={[s.logoutHeaderBtn, { borderColor: p.border, backgroundColor: p.card }]}
          >
            <Ionicons name="log-out-outline" size={16} color={colors.danger} />
            <Text style={s.logoutHeaderText}>Exit</Text>
          </Pressable>
        }
      />

      {/* Hero Financial Ledger Card (Bento Style) */}
      <View style={[s.heroCard, shadows.sm, { backgroundColor: p.card, borderColor: p.border }]}>
        <View style={s.heroTop}>
          <View>
            <Text style={[s.heroLabel, { color: p.sub }]}>Total Outstanding BAKI</Text>
            <MoneyText value={totalBaki} baki style={s.heroValue} />
          </View>
          <View style={s.collectionBadge}>
            <Ionicons name="pie-chart" size={13} color={colors.primary} />
            <Text style={s.collectionBadgeText}>{collectionRatio}% Collected</Text>
          </View>
        </View>

        {/* Collection Ratio Progress Bar */}
        <View style={[s.progressBarTrack, { backgroundColor: p.cardSecondary }]}>
          <View style={[s.progressBarFill, { width: `${collectionRatio}%` }]} />
        </View>

        <View style={s.heroSubMetrics}>
          <View style={s.subMetricCol}>
            <Text style={[s.subMetricLabel, { color: p.sub }]}>Gross Sales</Text>
            <MoneyText value={totalSales} style={s.subMetricVal} />
          </View>

          <View style={[s.vDivider, { backgroundColor: p.border }]} />

          <View style={s.subMetricCol}>
            <Text style={[s.subMetricLabel, { color: p.sub }]}>Total Collected</Text>
            <MoneyText value={totalCollected} style={[s.subMetricVal, { color: colors.successDark }]} />
          </View>

          <View style={[s.vDivider, { backgroundColor: p.border }]} />

          <View style={s.subMetricCol}>
            <Text style={[s.subMetricLabel, { color: p.sub }]}>Retail Outlets</Text>
            <Text style={[s.subMetricVal, { color: p.text }]}>{d?.totalShops || 0}</Text>
          </View>
        </View>
      </View>

      {/* Today's Pulse */}
      <View style={s.sectionHeader}>
        <Text style={[s.sectionTitle, { color: p.text }]}>Today's Field Route</Text>
        <Text style={[s.sectionSub, { color: p.sub }]}>Live IST Activity</Text>
      </View>

      <View style={s.todayGrid}>
        <View style={[s.todayTile, shadows.sm, { backgroundColor: p.card, borderColor: p.border }]}>
          <View style={[s.todayIconWrap, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="receipt-outline" size={16} color={colors.primary} />
          </View>
          <Text style={[s.todayVal, { color: p.text }]}>{d?.todayVisits || 0}</Text>
          <Text style={[s.todayLabel, { color: p.sub }]}>Orders Placed</Text>
        </View>

        <View style={[s.todayTile, shadows.sm, { backgroundColor: p.card, borderColor: p.border }]}>
          <View style={[s.todayIconWrap, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="trending-up-outline" size={16} color={colors.success} />
          </View>
          <MoneyText value={d?.todaySales || 0} style={s.todayVal} />
          <Text style={[s.todayLabel, { color: p.sub }]}>Today Sales</Text>
        </View>

        <View style={[s.todayTile, shadows.sm, { backgroundColor: p.card, borderColor: p.border }]}>
          <View style={[s.todayIconWrap, { backgroundColor: '#FEF2F2' }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
          </View>
          <MoneyText value={d?.todayBaki || 0} baki style={[s.todayVal, { color: colors.danger }]} />
          <Text style={[s.todayLabel, { color: p.sub }]}>Today BAKI</Text>
        </View>
      </View>

      {/* 7-Day Performance Chart */}
      <View style={s.sectionHeader}>
        <Text style={[s.sectionTitle, { color: p.text }]}>Revenue Velocity</Text>
        <Text style={[s.sectionSub, { color: p.sub }]}>7-Day Volume</Text>
      </View>

      {chart.length ? (
        <View style={[s.chartCard, shadows.sm, { backgroundColor: p.card, borderColor: p.border }]}>
          <BarChart
            data={{
              labels: chart.map((x) => shortDate(x.date)),
              datasets: [{ data: chart.map((x) => Number(x.amount || 0)) }],
            }}
            width={Dimensions.get('window').width - 48}
            height={210}
            yAxisLabel="₹"
            yAxisSuffix=""
            chartConfig={{
              backgroundGradientFrom: p.card,
              backgroundGradientTo: p.card,
              decimalPlaces: 0,
              color: () => colors.primary,
              labelColor: () => p.sub,
              barPercentage: 0.5,
              propsForBackgroundLines: {
                stroke: p.borderSubtle,
                strokeDasharray: '4',
              },
            }}
            fromZero
            showValuesOnTopOfBars
            style={{ borderRadius: radius.md }}
          />
        </View>
      ) : (
        <EmptyState title="No historical orders" message="Sales graph will appear once orders are placed." />
      )}

      {/* Field Force Leaderboard */}
      <View style={s.sectionHeader}>
        <Text style={[s.sectionTitle, { color: p.text }]}>Sales Representatives</Text>
        <Pressable onPress={() => router.push('/salespersons')}>
          <Text style={s.seeAllLink}>Manage Team ›</Text>
        </Pressable>
      </View>

      {d?.topSalespersons && d.topSalespersons.length > 0 ? (
        d.topSalespersons.map((x, i) => (
          <View
            key={x.id}
            style={[s.personRow, shadows.sm, { backgroundColor: p.card, borderColor: p.border }]}
          >
            <View style={[s.rankPill, { backgroundColor: i === 0 ? '#FEF3C7' : '#F1F5F9' }]}>
              <Text
                style={[
                  s.rankText,
                  { color: i === 0 ? '#B45309' : colors.inkSecondary },
                ]}
              >
                #{i + 1}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[s.personName, { color: p.text }]}>{x.name}</Text>
              <Text style={[s.personSub, { color: p.sub }]}>
                {x.totalShops} shops · {(x as any).ordersCount || (x as any).orders?.length || 0} orders
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <MoneyText value={x.totalSales} style={{ fontSize: 14, fontWeight: '800' }} />
              <Text style={{ fontSize: 11, color: colors.successDark, fontWeight: '600', marginTop: 2 }}>
                ₹{Number(x.totalCollected || 0).toLocaleString('en-IN')} recvd
              </Text>
            </View>
          </View>
        ))
      ) : (
        <EmptyState title="No active team data" />
      )}

      {/* Priority Credit Recovery (High BAKI) */}
      <View style={s.sectionHeader}>
        <Text style={[s.sectionTitle, { color: p.text }]}>Accounts With BAKI Due</Text>
        <Pressable onPress={() => router.push('/shops')}>
          <Text style={s.seeAllLink}>All Outlets ›</Text>
        </Pressable>
      </View>

      {d?.topBakiShops && d.topBakiShops.length > 0 ? (
        d.topBakiShops.slice(0, 5).map((x) => (
          <Pressable
            key={x.id}
            onPress={() => router.push({ pathname: '/admin-shop/[id]', params: { id: x.id } })}
            style={({ pressed }) => [
              s.bakiShopRow,
              shadows.sm,
              {
                backgroundColor: p.card,
                borderColor: '#FECACA',
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[s.shopInitial, { backgroundColor: '#FEF2F2' }]}>
              <Text style={{ color: colors.danger, fontWeight: '800', fontSize: 14 }}>
                {(x.name?.[0] || 'S').toUpperCase()}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[s.bakiShopName, { color: p.text }]} numberOfLines={1}>
                {x.name}
              </Text>
              <Text style={[s.bakiShopOwner, { color: p.sub }]} numberOfLines={1}>
                {x.ownerName} · {x.contactNumber}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 10, color: colors.danger, fontWeight: '700' }}>PENDING</Text>
              <MoneyText value={x.baki} baki style={{ fontSize: 14, fontWeight: '800' }} />
            </View>
          </Pressable>
        ))
      ) : (
        <EmptyState title="No credit exposure" message="All customer orders are fully settled." />
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  logoutHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  logoutHeaderText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 12,
  },
  heroCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginTop: spacing.xs,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 30,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  collectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  collectionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: spacing.md,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  heroSubMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  subMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  subMetricLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  subMetricVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  vDivider: {
    width: 1,
    height: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  seeAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  todayGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.lg,
  },
  todayTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    alignItems: 'center',
  },
  todayIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  todayVal: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  todayLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  chartCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 12,
    overflow: 'hidden',
  },
  personRow: {
    marginHorizontal: spacing.lg,
    marginBottom: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 11,
    fontWeight: '800',
  },
  personName: {
    fontSize: 14,
    fontWeight: '700',
  },
  personSub: {
    fontSize: 11,
    marginTop: 2,
  },
  bakiShopRow: {
    marginHorizontal: spacing.lg,
    marginBottom: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shopInitial: {
    width: 34,
    height: 34,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bakiShopName: {
    fontSize: 14,
    fontWeight: '700',
  },
  bakiShopOwner: {
    fontSize: 11,
    marginTop: 2,
  },
});
