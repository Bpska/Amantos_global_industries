import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { salesApi } from '@/services/api';
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

export default function Shops() {
  const p = usePalette();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const debouncedSearch = useDebounce(search);

  const q = useInfiniteQuery({
    queryKey: ['my-shops', debouncedSearch, status],
    queryFn: async ({ pageParam }) =>
      normalizePage(
        await salesApi.myShops({
          page: pageParam,
          limit: 15,
          search: debouncedSearch,
          status: status === 'ALL' ? undefined : status,
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
        title="Store Directory"
        subtitle={`${data.length} retail accounts enrolled`}
        right={
          <Pressable
            onPress={() => router.push('/add')}
            style={[s.addBtn, { backgroundColor: colors.primary }, shadows.sm]}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        }
      />

      {/* High-Precision Search Bar */}
      <View style={[s.searchWrap, { backgroundColor: p.card, borderColor: p.border }, shadows.xs]}>
        <Ionicons name="search" size={18} color={p.sub} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by store name, owner or mobile..."
          placeholderTextColor={p.sub}
          style={[s.searchInput, { color: p.text }]}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={p.sub} />
          </Pressable>
        ) : null}
      </View>

      {/* Segmented Status Filters */}
      <View style={{ marginBottom: 12 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterScroll}
        >
          {STATUS_FILTERS.map((item) => {
            const active = status === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setStatus(item.key)}
                style={[
                  s.filterPill,
                  {
                    backgroundColor: active ? colors.primary : p.card,
                    borderColor: active ? colors.primary : p.border,
                  },
                ]}
              >
                <Text
                  style={[
                    s.filterText,
                    { color: active ? '#fff' : p.text, fontWeight: active ? '800' : '600' },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Directory List */}
      {q.isLoading ? (
        <Skeleton />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(x) => x.id}
          renderItem={({ item }) => (
            <ShopCard
              shop={item}
              onPress={() => router.push({ pathname: '/shop/[id]', params: { id: item.id } })}
            />
          )}
          onEndReached={() => q.hasNextPage && q.fetchNextPage()}
          onEndReachedThreshold={0.4}
          refreshing={q.isRefetching}
          onRefresh={q.refetch}
          ListEmptyComponent={
            <EmptyState
              title="No Retailers Found"
              message={
                search
                  ? `No matching stores found for "${search}". Verify the spelling or clear search.`
                  : "You haven't onboarded any retailers in this view. Tap '+' above to onboard."
              }
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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
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
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
