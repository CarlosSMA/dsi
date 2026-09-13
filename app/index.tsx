import { Redirect } from 'expo-router';

import { useAuth } from '@/src/contexts/AuthContext';

export default function IndexRoute() {
  const { isAuthenticated } = useAuth();

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/login'} />;
}
