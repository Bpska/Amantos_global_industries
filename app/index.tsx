import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth';

export default function Index() {
  const { user, token } = useAuthStore();

  if (!token || !user) {
    return <Redirect href="/login" />;
  }

  return <Redirect href={user.role === 'ADMIN' ? '/dashboard' : '/home'} />;
}
