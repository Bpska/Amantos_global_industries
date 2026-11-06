import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { usePalette } from '@/components/ui';

export default function AdminLayout() {
  const p = usePalette();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: p.card,
          borderTopColor: p.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarIcon: ({ color, focused, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse-outline';
          if (route.name === 'dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'shops') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          } else if (route.name === 'reports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'salespersons') {
            iconName = focused ? 'people' : 'people-outline';
          }
          return <Ionicons name={iconName} color={String(color)} size={size || 22} />;
        },
      })}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Overview' }} />
      <Tabs.Screen name="shops" options={{ title: 'Retailers' }} />
      <Tabs.Screen name="reports" options={{ title: 'Analytics' }} />
      <Tabs.Screen name="salespersons" options={{ title: 'Field Team' }} />
    </Tabs>
  );
}
