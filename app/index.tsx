import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useAuth } from '@/src/contexts/auth-context';

export default function IndexRoute() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2167E8" />
      </View>
    );
  }

  return <Redirect href={usuario ? '/map' : '/login'} />;
}
