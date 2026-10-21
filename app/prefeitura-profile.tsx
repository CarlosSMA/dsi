import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import { useAuth } from '@/src/contexts/auth-context';
import { PrefeituraProfileView } from '@/src/features/profile/PrefeituraProfileView';

export default function PrefeituraProfileRoute() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <MaterialIcons name="account-balance" size={32} color={AppColors.actionBlue} />
        <Text style={styles.loadingText}>Carregando painel da prefeitura...</Text>
      </SafeAreaView>
    );
  }

  if (!usuario) {
    return <Redirect href="/login" />;
  }

  // RBAC Guard: Se não for agente municipal, redireciona para o perfil de cidadão
  if (usuario.role !== 'agente') {
    return <Redirect href="/profile" />;
  }

  return <PrefeituraProfileView usuario={usuario} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
});
