import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import { useAuth } from '@/src/contexts/auth-context';

export default function DashboardRoute() {
  const router = useRouter();
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <MaterialIcons name="insert-chart" size={32} color={AppColors.actionBlue} />
        <Text style={styles.stateText}>Carregando dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (!usuario) {
    return <Redirect href="/login" />;
  }

  if (usuario.role !== 'agente') {
    return <Redirect href="/profile" />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Voltar para o perfil da prefeitura"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.replace('/prefeitura-profile')}
          style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={AppColors.primaryText} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Visão geral da gestão municipal</Text>
        </View>
        <View style={styles.headerIcon}>
          <MaterialIcons name="insert-chart" size={22} color={AppColors.actionBlue} />
        </View>
      </View>

      <View style={styles.emptyState}>
        <View style={styles.emptyIconBox}>
          <MaterialIcons name="insert-chart" size={40} color={AppColors.actionBlue} />
        </View>
        <Text style={styles.emptyTitle}>Dashboard em construção</Text>
        <Text style={styles.emptyText}>
          Os indicadores da gestão municipal serão exibidos aqui nas próximas etapas.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
  },
  stateText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: AppColors.primaryText,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: AppColors.secondaryText,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.primaryText,
    textAlign: 'center',
  },
  emptyText: {
    maxWidth: 320,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: AppColors.secondaryText,
    textAlign: 'center',
  },
});
