import { useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { normalizePage } from '@/utils/format';
import { useDebounce } from '@/hooks/useDebounce';
import { AppHeader } from '@/components/AppHeader';
import { ShopCard } from '@/components/ShopCard';
import { EmptyState, Skeleton, usePalette } from '@/components/ui';
import { colors, shadows } from '@/constants/theme';

const STATUS_FILTERS = [
  { key: 'ALL', label: 'All Accounts' },
  { key: 'PAID', label: 'Settled' },
  { key: 'PARTIAL', label: 'Partial BAKI' },
  { key: 'UNPAID', label: 'Unpaid' },
];

export default function AdminShops() {
  const p = usePalette();
  const { logout } = useAuthStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [salespersonId, setSalespersonId] = useState('');
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
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

  const people = useQuery({
    queryKey: ['salespersons-filter'],
    queryFn: async () => normalizePage(await adminApi.salespersons()),
  });

  const debouncedSearch = useDebounce(search);

  const q = useInfiniteQuery({
    queryKey: [
      'admin-shops',
      debouncedSearch,
      status,
      salespersonId,
      from?.toISOString(),
      to?.toISOString(),
    ],
    queryFn: async ({ pageParam }) =>
      normalizePage(
        await adminApi.shops({
          page: pageParam,
          limit: 15,
          search: debouncedSearch,
          status: status === 'ALL' ? undefined : status,
          salespersonId: salespersonId || undefined,
          from: from?.toISOString(),
          to: to?.toISOString(),
        })
      ),
    initialPageParam: 1,
    getNextPageParam: (x) =>
      x.nextPage ?? (x.page < x.totalPages ? x.page + 1 : undefined),
  });

  const data = q.data?.pages.flatMap((x) => x.data) || [];

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <AppHeader
        title="Retailer Master"
        subtitle={`${data.length} accounts matching filters`}
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

      {/* Search Input */}
      <View style={[s.searchWrap, { backgroundColor: p.card, borderColor: p.border }, shadows.xs]}>
        <Ionicons name="search" size={18} color={p.sub} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by store name, proprietor or contact..."
          placeholderTextColor={p.sub}
          style={[s.searchInput, { color: p.text }]}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={p.sub} />
          </Pressable>
        ) : null}
      </View>

      {/* Filter by Status */}
      <View style={{ marginBottom: 6 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
          {STATUS_FILTERS.map((x) => {
            const active = status === x.key;
            return (
              <Pressable
                key={x.key}
                onPress={() => setStatus(x.key)}
                style={[
                  s.filterPill,
                  {
                    backgroundColor: active ? colors.primary : p.card,
                    borderColor: active ? colors.primary : p.border,
                  },
                ]}
              >
                <Text style={[s.filterPillText, { color: active ? '#fff' : p.text, fontWeight: active ? '800' : '600' }]}>
                  {x.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Filter by Field Representative */}
      <View style={{ marginBottom: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
          <Pressable
            onPress={() => setSalespersonId('')}
            style={[
              s.filterPill,
              {
                backgroundColor: !salespersonId ? colors.navy : p.card,
                borderColor: !salespersonId ? colors.navy : p.border,
              },
            ]}
          >
            <Text style={[s.filterPillText, { color: !salespersonId ? '#fff' : p.text, fontWeight: !salespersonId ? '800' : '600' }]}>
              All Sales Reps
            </Text>
          </Pressable>

          {people.data?.data?.map((person: any) => {
            const active = salespersonId === person.id;
            return (
              <Pressable
                key={person.id}
                onPress={() => setSalespersonId(person.id)}
                style={[
                  s.filterPill,
                  {
                    backgroundColor: active ? colors.navy : p.card,
                    borderColor: active ? colors.navy : p.border,
                  },
                ]}
              >
                <Text style={[s.filterPillText, { color: active ? '#fff' : p.text, fontWeight: active ? '800' : '600' }]}>
                  {person.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Date Range Selector Strip */}
      <View style={s.dateFilterStrip}>
        <Pressable
          onPress={() => setPicker('from')}
          style={[s.dateBtn, { backgroundColor: p.card, borderColor: p.border }]}
        >
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={[s.dateBtnText, { color: p.text }]}>
            {from ? from.toLocaleDateString('en-IN') : 'From Date'}
          </Text>
        </Pressable>

        <Text style={{ color: p.sub, fontWeight: '700' }}>to</Text>

        <Pressable
          onPress={() => setPicker('to')}
          style={[s.dateBtn, { backgroundColor: p.card, borderColor: p.border }]}
        >
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={[s.dateBtnText, { color: p.text }]}>
            {to ? to.toLocaleDateString('en-IN') : 'To Date'}
          </Text>
        </Pressable>

        {(from || to) && (
          <Pressable
            onPress={() => {
              setFrom(null);
              setTo(null);
            }}
            style={s.clearDateBtn}
          >
            <Ionicons name="close" size={14} color={colors.danger} />
            <Text style={{ color: colors.danger, fontSize: 11, fontWeight: '800' }}>Reset</Text>
          </Pressable>
        )}
      </View>

      {picker && (
        <DateTimePicker
          value={(picker === 'from' ? from : to) || new Date()}
          maximumDate={new Date()}
          onChange={(_, d) => {
            if (d) picker === 'from' ? setFrom(d) : setTo(d);
            setPicker(null);
          }}
        />
      )}

      {q.isLoading ? (
        <Skeleton />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(x) => x.id}
          renderItem={({ item }) => (
            <ShopCard
              admin
              shop={item}
              onPress={() => router.push({ pathname: '/admin-shop/[id]', params: { id: item.id } })}
            />
          )}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          refreshing={q.isRefetching}
          onRefresh={q.refetch}
          ListEmptyComponent={
            <EmptyState
              title="No Retailers Found"
              message="No retailer accounts match the applied filters and date parameters."
              icon="storefront-outline"
            />
          }
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
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    letterSpacing: 0.1,
  },
  dateFilterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  clearDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
});
