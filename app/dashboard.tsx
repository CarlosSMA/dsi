import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, Stack, useRouter } from 'expo-router';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import { useAuth } from '@/src/contexts/auth-context';
import { listarDenuncias } from '@/src/services/denuncias-consulta-service';
import type { Denuncia } from '@/src/types';
import {
  criarEvolucao,
  criarPrioridades,
  criarRankingBairros,
  evolucaoMaximo,
  type DashboardStats,
  INITIAL_STATS,
  PERIOD_OPTIONS,
} from '@/src/features/dashboard/dashboard-utils';

export default function DashboardRoute() {
  const router = useRouter();
  const { usuario, carregando } = useAuth();
  const { width } = useWindowDimensions();
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [periodo, setPeriodo] = useState<number | null>(7);
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
      setDenuncias(denuncias);
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

  const evolucao = useMemo(
    () => criarEvolucao(denuncias, periodo),
    [denuncias, periodo]
  );
  const rankingBairros = useMemo(() => criarRankingBairros(denuncias), [denuncias]);
  const prioridades = useMemo(() => criarPrioridades(denuncias), [denuncias]);
  const statCardWidth = width >= 700 ? '23%' : '48%';
  const summaryCards = [
    { icon: 'assignment', label: 'Total', value: stats.total, color: AppColors.actionBlue, backgroundColor: '#EFF6FF' },
    { icon: 'schedule', label: 'Pendentes', value: stats.pendentes, color: AppColors.attention, backgroundColor: '#FFFBEB' },
    { icon: 'check-circle', label: 'Confirmadas', value: stats.confirmadas, color: AppColors.safe, backgroundColor: '#ECFDF5' },
    { icon: 'cancel', label: 'Rejeitadas', value: stats.rejeitadas, color: AppColors.highRisk, backgroundColor: '#FEF2F2' },
  ] as const;

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
            accessibilityLabel="Tentar carregar os indicadores novamente"
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
            {summaryCards.map((card) => (
              <StatCard {...card} cardWidth={statCardWidth} key={card.label} />
            ))}
          </View>
          <Text style={styles.sectionTitle}>Evolução das denúncias</Text>
          <View style={styles.panel}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.periodOptions}>
                {PERIOD_OPTIONS.map((option) => {
                  const selecionado = periodo === option.days;

                  return (
                    <Pressable
                      accessibilityLabel={`Filtrar por ${option.label}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: selecionado }}
                      key={option.label}
                      onPress={() => setPeriodo(option.days)}
                      style={[styles.periodButton, selecionado && styles.periodButtonSelected]}>
                      <Text
                        style={[
                          styles.periodButtonText,
                          selecionado && styles.periodButtonTextSelected,
                        ]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            {evolucao.length === 0 ? (
              <View style={styles.chartEmptyState}>
                <MaterialIcons name="show-chart" size={32} color="#94A3B8" />
                <Text style={styles.chartEmptyText}>
                  Nenhuma denúncia no período selecionado.
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chart}>
                  <View style={styles.bars}>
                    {evolucao.map((item) => (
                      <View style={styles.barColumn} key={item.key}>
                        <Text style={styles.barValue}>{item.total}</Text>
                        <View
                          style={[
                            styles.bar,
                            { height: Math.max(8, (item.total / evolucaoMaximo(evolucao)) * 120) },
                          ]}
                        />
                        <Text style={styles.barLabel}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
          <Text style={styles.sectionTitle}>Prioridades de atendimento</Text>
          <View style={[styles.panel, styles.rankingPanel]}>
            {prioridades.length === 0 ? (
              <View style={styles.noPriority}>
                <MaterialIcons name="check-circle" size={22} color={AppColors.safe} />
                <Text style={styles.chartEmptyText}>Nenhuma denúncia pendente.</Text>
              </View>
            ) : (
              prioridades.map((prioridade) => (
                <View style={styles.priorityRow} key={prioridade.id}>
                  <MaterialIcons name="priority-high" size={20} color={AppColors.attention} />
                  <View style={styles.priorityInfo}>
                    <Text numberOfLines={1} style={styles.rankingName}>
                      {prioridade.bairro}
                    </Text>
                    <Text style={styles.rankingTotal}>{prioridade.tempo}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
          <Text style={styles.sectionTitle}>Bairros com mais denúncias</Text>
          <View style={[styles.panel, styles.rankingPanel]}>
            {rankingBairros.length === 0 ? (
              <Text style={styles.chartEmptyText}>Nenhuma denúncia registrada.</Text>
            ) : (
              rankingBairros.map((bairro, index) => (
                <View style={styles.rankingRow} key={bairro.nome}>
                  <Text style={styles.rankingPosition}>{index + 1}</Text>
                  <Text numberOfLines={1} style={styles.rankingName}>
                    {bairro.nome}
                  </Text>
                  <Text style={styles.rankingTotal}>
                    {bairro.total} {bairro.total === 1 ? 'denúncia' : 'denúncias'}
                  </Text>
                </View>
              ))
            )}
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
  cardWidth: string;
}

function StatCard({ icon, label, value, color, backgroundColor, cardWidth }: StatCardProps) {
  return (
    <View style={[styles.statCard, { width: cardWidth }]}>
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
  panel: {
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
  periodOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  periodButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  periodButtonSelected: {
    backgroundColor: '#DBEAFE',
  },
  periodButtonText: {
    fontSize: 12,
    color: AppColors.secondaryText,
    fontWeight: '700',
  },
  periodButtonTextSelected: {
    color: '#1D4ED8',
  },
  chart: {
    minWidth: 290,
    paddingTop: 4,
  },
  bars: {
    height: 166,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingHorizontal: 4,
  },
  barColumn: {
    width: 30,
    height: 166,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barValue: {
    marginBottom: 4,
    fontSize: 11,
    color: AppColors.secondaryText,
    fontWeight: '700',
  },
  bar: {
    width: 20,
    minHeight: 8,
    borderRadius: 6,
    backgroundColor: AppColors.actionBlue,
  },
  barLabel: {
    marginTop: 6,
    fontSize: 10,
    color: AppColors.secondaryText,
  },
  chartEmptyState: {
    minHeight: 145,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  chartEmptyText: {
    fontSize: 13,
    color: AppColors.secondaryText,
    textAlign: 'center',
  },
  rankingPanel: {
    paddingVertical: 0,
  },
  rankingRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rankingPosition: {
    width: 22,
    fontSize: 14,
    color: AppColors.actionBlue,
    fontWeight: '800',
    textAlign: 'center',
  },
  rankingName: {
    flex: 1,
    fontSize: 14,
    color: AppColors.primaryText,
    fontWeight: '700',
  },
  rankingTotal: {
    fontSize: 12,
    color: AppColors.secondaryText,
    fontWeight: '600',
  },
  priorityRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  priorityInfo: {
    flex: 1,
    gap: 3,
  },
  noPriority: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
