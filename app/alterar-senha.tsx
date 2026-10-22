import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { AppColors } from '@/constants/theme';
import { useAuth } from '@/src/contexts/auth-context';
import { AlterarSenhaScreen } from '@/src/features/profile/AlterarSenhaScreen';

export default function AlterarSenhaRoute() {
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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AlterarSenhaScreen usuario={usuario} />
    </>
  );
}
