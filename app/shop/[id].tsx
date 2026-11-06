import { useLocalSearchParams } from 'expo-router';
import { ShopDetailView } from '@/components/ShopDetailView';

export default function ShopDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ShopDetailView id={id} />;
}
