import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MoneyText, StatusChip, usePalette } from './ui';
import { dateDay } from '@/utils/format';
import { colors, radius, shadows, spacing } from '@/constants/theme';
import type { Shop } from '@/types';

export function ShopCard({
  shop,
  onPress,
  admin = false,
}: {
  shop: Shop;
  onPress: () => void;
  admin?: boolean;
}) {
  const p = usePalette();
  const initial = (shop.name?.[0] || 'S').toUpperCase();
  const hasBaki = Number(shop.baki || 0) > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.card,
        shadows.sm,
        {
          backgroundColor: p.card,
          borderColor: hasBaki ? '#FECACA' : p.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {/* Top Header Row */}
      <View style={s.headerRow}>
        <View style={s.avatarContainer}>
          <Text style={s.avatarText}>{initial}</Text>
        </View>

        <View style={s.titleWrap}>
          <Text style={[s.name, { color: p.text }]} numberOfLines={1}>
            {shop.name}
          </Text>
          <Text style={[s.owner, { color: p.sub }]} numberOfLines={1}>
            {shop.ownerName} · {shop.contactNumber}
          </Text>
        </View>

        <StatusChip status={shop.status} />
      </View>

      {/* Location line */}
      <View style={s.locationRow}>
        <Ionicons name="location-outline" size={13} color={p.sub} />
        <Text style={[s.locationText, { color: p.sub }]} numberOfLines={1}>
          {shop.location}
        </Text>
      </View>

      {/* Salesperson tag (if admin) */}
      {admin && shop.salesperson && (
        <View style={s.salesTag}>
          <Ionicons name="person-outline" size={12} color={colors.primary} />
          <Text style={[s.salesText, { color: p.sub }]}>
            Rep: <Text style={{ color: colors.primary, fontWeight: '700' }}>{shop.salesperson.name}</Text>
          </Text>
        </View>
      )}

      {/* Financial Ledger Breakdown */}
      <View style={[s.ledger, { backgroundColor: p.cardSecondary, borderColor: p.borderSubtle }]}>
        <View style={s.ledgerItem}>
          <Text style={[s.ledgerLabel, { color: p.sub }]}>Billed</Text>
          <MoneyText value={shop.totalAmount} style={s.ledgerVal} />
        </View>

        <View style={[s.divider, { backgroundColor: p.border }]} />

        <View style={s.ledgerItem}>
          <Text style={[s.ledgerLabel, { color: p.sub }]}>Collected</Text>
          <MoneyText value={shop.paidAmount} style={s.ledgerVal} />
        </View>

        <View style={[s.divider, { backgroundColor: p.border }]} />

        <View style={s.ledgerItem}>
          <Text style={[s.ledgerLabel, { color: hasBaki ? colors.danger : p.sub }]}>
            Pending BAKI
          </Text>
          <MoneyText
            value={shop.baki}
            baki
            style={[s.ledgerVal, hasBaki ? { color: colors.danger } : undefined]}
          />
        </View>
      </View>

      {/* Card Footer */}
      <View style={s.footer}>
        <Text style={[s.date, { color: p.sub }]}>{dateDay(shop.createdAt)}</Text>
        <View style={s.arrowLink}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>View details</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 16,
  },
  titleWrap: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  owner: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  locationText: {
    fontSize: 12,
    flex: 1,
  },
  salesTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  salesText: {
    fontSize: 11,
  },
  ledger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.xs + 2,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  ledgerItem: {
    flex: 1,
    alignItems: 'center',
  },
  ledgerLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  ledgerVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  divider: {
    width: 1,
    height: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  date: {
    fontSize: 11,
  },
  arrowLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
