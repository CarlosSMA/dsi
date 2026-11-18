import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { AppColors } from '@/constants/theme';
import { useAuth } from '@/src/contexts/auth-context';
import { ScorePesosScreen } from '@/src/features/profile/ScorePesosScreen';

export default function ScorePesosRoute() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={AppColors.actionBlue} />
      </View>
    );
  }

  if (!usuario) {
    return <Redirect href="/login" />;
  }

  // Só agentes da prefeitura acessam o score.
  if (usuario.role !== 'agente') {
    return <Redirect href="/profile" />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScorePesosScreen />
    </>
  );
}
