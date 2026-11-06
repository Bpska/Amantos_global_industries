import React from 'react';
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { salesApi } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { AppHeader } from '@/components/AppHeader';
import { EmptyState, MoneyText, Skeleton, StatusChip, usePalette } from '@/components/ui';
import { dateDay } from '@/utils/format';
import { colors, radius, shadows, spacing } from '@/constants/theme';

export default function Home() {
  const p = usePalette();
  const user = useAuthStore((s) => s.user);
  const q = useQuery({ queryKey: ['summary'], queryFn: salesApi.summary });
  const productsQ = useQuery({ queryKey: ['products'], queryFn: salesApi.products });
  const d = q.data;

  if (q.isLoading) return <Skeleton />;

  const firstName = user?.name?.split(' ')[0] || user?.username || 'Partner';
  const todayVisits = d?.todayVisits || 0;
  const targetVisits = 10;
  const visitProgress = Math.min(100, Math.round((todayVisits / targetVisits) * 100));

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
      {/* Header */}
      <AppHeader
        title={`Namaste, ${firstName} 👋`}
        subtitle="Field Sales & Retailer Command"
        right={
          <Pressable
            onPress={() => router.push('/profile')}
            style={[s.profileAvatar, { backgroundColor: p.card, borderColor: p.border }]}
          >
            <Ionicons name="person" size={16} color={colors.primary} />
          </Pressable>
        }
      />

      {/* Daily Route Progress Card */}
      <View style={[s.targetCard, shadows.sm, { backgroundColor: p.card, borderColor: p.border }]}>
        <View style={s.targetHeader}>
          <View>
            <Text style={[s.targetTitle, { color: p.text }]}>Today's Target Progress</Text>
            <Text style={[s.targetSub, { color: p.sub }]}>
              {todayVisits} of {targetVisits} retail visits logged
            </Text>
          </View>
          <View style={[s.targetBadge, { backgroundColor: '#ECFDF5' }]}>
            <Text style={s.targetBadgeText}>{visitProgress}%</Text>
          </View>
        </View>

        <View style={[s.progressBarTrack, { backgroundColor: p.cardSecondary }]}>
          <View style={[s.progressBarFill, { width: `${Math.max(8, visitProgress)}%` }]} />
        </View>

        <View style={s.targetMetricsRow}>
          <View style={s.targetMetricItem}>
            <Text style={[s.metricLabel, { color: p.sub }]}>Today Sales</Text>
            <MoneyText value={d?.todaySales || 0} style={s.metricVal} />
          </View>

          <View style={[s.vDivider, { backgroundColor: p.border }]} />

          <View style={s.targetMetricItem}>
            <Text style={[s.metricLabel, { color: p.sub }]}>Collected Today</Text>
            <MoneyText
              value={d?.todayCollected || 0}
              style={[s.metricVal, { color: colors.successDark }]}
            />
          </View>

          <View style={[s.vDivider, { backgroundColor: p.border }]} />

          <View style={s.targetMetricItem}>
            <Text style={[s.metricLabel, { color: p.sub }]}>Today BAKI</Text>
            <MoneyText
              value={d?.todayBaki || 0}
              baki
              style={[s.metricVal, { color: colors.danger }]}
            />
          </View>
        </View>
      </View>

      {/* Quick Action Navigation Grid */}
      <View style={s.actionRow}>
        <Pressable
          style={[s.primaryActionBtn, shadows.glowPrimary, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/add')}
        >
          <View style={s.primaryActionIcon}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={s.primaryActionTitle}>Onboard Retailer</Text>
            <Text style={s.primaryActionSub}>Add store & first order</Text>
          </View>
        </Pressable>

        <Pressable
          style={[s.secondaryActionBtn, shadows.sm, { backgroundColor: p.card, borderColor: p.border }]}
          onPress={() => router.push('/shops')}
        >
          <View style={[s.secondaryActionIcon, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="storefront-outline" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={[s.secondaryActionTitle, { color: p.text }]}>My Stores</Text>
            <Text style={[s.secondaryActionSub, { color: p.sub }]}>
              {d?.totalShops || 0} accounts
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Authorized Product Catalog & SKUs Section (From Admin) */}
      <View style={s.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="cube-outline" size={17} color={colors.primary} />
          <Text style={[s.sectionTitle, { color: p.text }]}>Product Catalog (Admin SKUs)</Text>
        </View>
        <Text style={[s.sectionSub, { color: p.sub }]}>
          {productsQ.data?.length || 0} active
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 10, paddingBottom: 6 }}
      >
        {productsQ.isLoading ? (
          <Text style={{ color: p.sub, fontSize: 13, paddingVertical: 12 }}>Loading products…</Text>
        ) : (productsQ.data && productsQ.data.length > 0 ? (
          productsQ.data.map((prod) => (
            <Pressable
              key={prod.id}
              onPress={() => router.push({ pathname: '/add' })}
              style={[
                {
                  width: 165,
                  padding: 13,
                  borderRadius: 14,
                  backgroundColor: p.card,
                  borderWidth: 1,
                  borderColor: p.border,
                  justifyContent: 'space-between',
                },
                shadows.sm,
              ]}
            >
              <View>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: p.dark ? '#1E293B' : '#EFF6FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}>
                  <Ionicons name="cube" size={16} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '800', color: p.text }} numberOfLines={2}>
                  {prod.name}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: p.sub, marginTop: 2 }}>
                  {prod.category || 'General'}
                </Text>
              </View>

              <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: p.borderSubtle, paddingTop: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: '900', color: colors.settled }}>
                  ₹{Number(prod.unitPrice).toFixed(2)}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>Sell</Text>
                  <Ionicons name="chevron-forward" size={12} color={colors.primary} />
                </View>
              </View>
            </Pressable>
          ))
        ) : (
          <Text style={{ color: p.sub, fontSize: 13, paddingVertical: 12 }}>No products configured yet.</Text>
        ))}
      </ScrollView>

      {/* Portfolio Overview Strip */}
      <View style={s.sectionHeader}>
        <Text style={[s.sectionTitle, { color: p.text }]}>Portfolio Performance</Text>
        <Text style={[s.sectionSub, { color: p.sub }]}>All Time</Text>
      </View>

      <View style={s.portfolioGrid}>
        <View style={[s.portfolioTile, shadows.sm, { backgroundColor: p.card, borderColor: p.border }]}>
          <Text style={[s.portfolioLabel, { color: p.sub }]}>Cumulative Volume</Text>
          <MoneyText value={d?.totalSales || 0} style={s.portfolioVal} />
        </View>

        <View style={[s.portfolioTile, shadows.sm, { backgroundColor: p.card, borderColor: p.border }]}>
          <Text style={[s.portfolioLabel, { color: p.sub }]}>Total Recovered</Text>
          <MoneyText value={d?.totalCollected || 0} style={[s.portfolioVal, { color: colors.successDark }]} />
        </View>

        <View style={[s.portfolioTile, shadows.sm, { backgroundColor: p.card, borderColor: '#FECACA' }]}>
          <Text style={[s.portfolioLabel, { color: colors.danger }]}>Outstanding BAKI</Text>
          <MoneyText value={d?.totalBaki || 0} baki style={[s.portfolioVal, { color: colors.danger }]} />
        </View>
      </View>

      {/* Recent Onboarded Stores */}
      <View style={s.sectionHeader}>
        <Text style={[s.sectionTitle, { color: p.text }]}>Recent Retail Outlets</Text>
        <Pressable onPress={() => router.push('/shops')}>
          <Text style={s.seeAllLink}>View All ({d?.totalShops || 0}) ›</Text>
        </Pressable>
      </View>

      {d?.recentEntries && d.recentEntries.length > 0 ? (
        d.recentEntries.slice(0, 5).map((x) => (
          <Pressable
            key={x.id}
            onPress={() => router.push({ pathname: '/shop/[id]', params: { id: x.id } })}
            style={({ pressed }) => [
              s.recentCard,
              shadows.sm,
              {
                backgroundColor: p.card,
                borderColor: p.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={s.recentTopRow}>
              <View style={s.recentInitial}>
                <Text style={{ fontWeight: '800', color: colors.primary, fontSize: 14 }}>
                  {(x.name?.[0] || 'S').toUpperCase()}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[s.recentName, { color: p.text }]} numberOfLines={1}>
                  {x.name}
                </Text>
                <Text style={[s.recentOwner, { color: p.sub }]} numberOfLines={1}>
                  {x.ownerName} · {dateDay(x.createdAt)}
                </Text>
              </View>

              <StatusChip status={x.status} />
            </View>

            <View style={[s.recentBottomRow, { borderTopColor: p.borderSubtle }]}>
              <View style={s.actionLinks}>
                <Pressable
                  onPress={() => Linking.openURL(`tel:${x.contactNumber}`)}
                  style={s.contactPill}
                >
                  <Ionicons name="call" size={12} color={colors.primary} />
                  <Text style={s.contactPillText}>Call</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    const phone = x.contactNumber.replace(/[^0-9]/g, '');
                    Linking.openURL(`https://wa.me/91${phone}`);
                  }}
                  style={[s.contactPill, { backgroundColor: '#ECFDF5' }]}
                >
                  <Ionicons name="logo-whatsapp" size={12} color="#10B981" />
                  <Text style={[s.contactPillText, { color: '#047857' }]}>WhatsApp</Text>
                </Pressable>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: p.sub }}>BAKI Due</Text>
                <MoneyText value={x.baki} baki style={{ fontSize: 14, fontWeight: '800' }} />
              </View>
            </View>
          </Pressable>
        ))
      ) : (
        <EmptyState
          title="No shops assigned yet"
          message="Tap 'Onboard Retailer' above to register your first merchant."
          actionTitle="Onboard Store"
          onAction={() => router.push('/add')}
        />
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  targetCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginTop: spacing.xs,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  targetSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  targetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  targetBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: spacing.md,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  targetMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  targetMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  vDivider: {
    width: 1,
    height: 22,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  primaryActionBtn: {
    flex: 1.2,
    borderRadius: radius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryActionIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryActionSub: {
    color: '#DBEAFE',
    fontSize: 11,
    marginTop: 1,
  },
  secondaryActionBtn: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  secondaryActionIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionSub: {
    fontSize: 11,
    marginTop: 1,
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
  portfolioGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.lg,
  },
  portfolioTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
  },
  portfolioLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  portfolioVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  recentCard: {
    marginHorizontal: spacing.lg,
    marginBottom: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 12,
  },
  recentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recentInitial: {
    width: 34,
    height: 34,
    borderRadius: radius.xs,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentName: {
    fontSize: 14,
    fontWeight: '700',
  },
  recentOwner: {
    fontSize: 11,
    marginTop: 2,
  },
  recentBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 8,
  },
  actionLinks: {
    flexDirection: 'row',
    gap: 6,
  },
  contactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  contactPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
