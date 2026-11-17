import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import { useAuth } from '@/src/contexts/auth-context';
import { listarDenuncias } from '@/src/services/denuncias-consulta-service';

interface DashboardStats {
  total: number;
  pendentes: number;
  confirmadas: number;
  rejeitadas: number;
}

const INITIAL_STATS: DashboardStats = {
  total: 0,
  pendentes: 0,
  confirmadas: 0,
  rejeitadas: 0,
};

export default function DashboardRoute() {
  const router = useRouter();
  const { usuario, carregando } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarDados = useCallback(async (refresh = false) => {
    if (refresh) {
      setAtualizando(true);
    } else {
      setCarregandoDados(true);
    }

    setErro(null);

    try {
      const denuncias = await listarDenuncias();
      setStats({
        total: denuncias.length,
        pendentes: denuncias.filter(({ statusDenuncia }) => statusDenuncia === 'pendente').length,
        confirmadas: denuncias.filter(({ statusDenuncia }) => statusDenuncia === 'confirmada').length,
        rejeitadas: denuncias.filter(({ statusDenuncia }) => statusDenuncia === 'rejeitada').length,
      });
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os indicadores do dashboard.'
      );
    } finally {
      setCarregandoDados(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    if (usuario?.role !== 'agente') {
      return;
    }

    const timeoutId = setTimeout(() => {
      carregarDados();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [carregarDados, usuario?.role]);

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

      {carregandoDados ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={AppColors.actionBlue} />
          <Text style={styles.stateText}>Carregando indicadores...</Text>
        </View>
      ) : erro ? (
        <View style={styles.centeredContainer}>
          <MaterialIcons name="error-outline" size={42} color={AppColors.highRisk} />
          <Text style={styles.stateTitle}>Não foi possível carregar</Text>
          <Text style={styles.errorText}>{erro}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => carregarDados()}
            style={styles.retryButton}>
            <MaterialIcons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={() => carregarDados(true)}
              colors={[AppColors.actionBlue]}
              tintColor={AppColors.actionBlue}
            />
          }
          showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Resumo das denúncias</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="assignment"
              label="Total"
              value={stats.total}
              color={AppColors.actionBlue}
              backgroundColor="#EFF6FF"
            />
            <StatCard
              icon="schedule"
              label="Pendentes"
              value={stats.pendentes}
              color={AppColors.attention}
              backgroundColor="#FFFBEB"
            />
            <StatCard
              icon="check-circle"
              label="Confirmadas"
              value={stats.confirmadas}
              color={AppColors.safe}
              backgroundColor="#ECFDF5"
            />
            <StatCard
              icon="cancel"
              label="Rejeitadas"
              value={stats.rejeitadas}
              color={AppColors.highRisk}
              backgroundColor="#FEF2F2"
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

interface StatCardProps {
  icon: ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: number;
  color: string;
  backgroundColor: string;
}

function StatCard({ icon, label, value, color, backgroundColor }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconBox, { backgroundColor }]}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  stateTitle: {
    marginTop: 4,
    fontSize: 18,
    color: AppColors.primaryText,
    fontWeight: '800',
  },
  errorText: {
    maxWidth: 320,
    marginTop: 4,
    fontSize: 14,
    lineHeight: 21,
    color: AppColors.secondaryText,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: AppColors.actionBlue,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 17,
    fontWeight: '800',
    color: AppColors.primaryText,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    minHeight: 132,
    padding: 16,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  statIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 25,
    fontWeight: '800',
    color: AppColors.primaryText,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 13,
    color: AppColors.secondaryText,
    fontWeight: '600',
  },
});
