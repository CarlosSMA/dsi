import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Href, Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import {
  calcularScorePriorizacao,
  LIMITE_RISCO_ALTO,
  LIMITE_RISCO_MEDIO,
  NIVEL_CORES,
  type DistritoScore,
} from '@/src/features/profile/utils/score-priorizacao';
import { DenunciaManager } from '@/src/models/Denuncia';
import type { Denuncia, Usuario } from '@/src/types';
import { useAuth } from '@/src/contexts/auth-context';

interface PrefeituraProfileViewProps {
  usuario: Usuario;
}

// Mostra só os distritos mais críticos, como no protótipo.
const DISTRITOS_EXIBIDOS = 3;

export function PrefeituraProfileView({ usuario }: PrefeituraProfileViewProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [denuncias, setDenuncias] = useState<Denuncia[] | null>(null);
  const [erroDenuncias, setErroDenuncias] = useState(false);

  // Acompanha as denúncias em tempo real: métricas e score se atualizam sozinhos quando algo muda.
  useEffect(
    () =>
      DenunciaManager.observar(
        (lista) => {
          setDenuncias(lista);
          setErroDenuncias(false);
        },
        (error) => {
          console.error('Não foi possível carregar as denúncias.', error);
          setErroDenuncias(true);
        }
      ),
    []
  );

  const stats = useMemo(() => {
    const lista = denuncias ?? [];
    return {
      abertas: lista.filter(({ statusDenuncia }) => statusDenuncia === 'pendente').length,
      confirmadas: lista.filter(({ statusDenuncia }) => statusDenuncia === 'confirmada').length,
      rejeitadas: lista.filter(({ statusDenuncia }) => statusDenuncia === 'rejeitada').length,
    };
  }, [denuncias]);

  const score = useMemo(() => calcularScorePriorizacao(denuncias ?? []), [denuncias]);
  const distritosExibidos = score.distritos.slice(0, DISTRITOS_EXIBIDOS);

  function handleDispatchDistrict(districtName: string) {
    Alert.alert(
      'Equipe de Campo',
      `Equipe de Agentes de Saúde despachada com sucesso para inspeção no ${districtName}!`,
      [{ text: 'OK' }]
    );
  }

  function handleModulePress(moduleName: string) {
    if (moduleName === 'Dashboard') {
      router.push('/dashboard' as Href);
    } else if (moduleName === 'Mapa Vetorial') {
      router.replace('/map');
    } else if (moduleName === 'Score & Pesos') {
      router.push('/score-pesos' as Href);
    } else if (moduleName === 'Denúncias') {
      router.push('/denuncias' as Href);
    } else {
      Alert.alert(
        moduleName,
        `Módulo '${moduleName}' habilitado para o perfil de Agente Municipal da Prefeitura do Recife.`,
        [{ text: 'Entendido' }]
      );
    }
  }

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* O painel tem cabeçalho próprio: esconde o cabeçalho padrão da navegação ("‹ map"), que cobria o topo.
          Fica aqui para valer tanto em /profile quanto em /prefeitura-profile. */}
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Card Cabeçalho: Painel da Prefeitura */}
        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <View style={styles.institutionIconBox}>
              <MaterialIcons name="account-balance" size={24} color={AppColors.actionBlue} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Painel da Prefeitura</Text>
              <Text style={styles.headerSubtitle}>
                Recife • Vigilância Ambiental
                {usuario.numero_matricula ? ` • Matrícula: ${usuario.numero_matricula}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>Ativo</Text>
          </View>
        </View>

        {/* Linha de métricas da revisão */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: AppColors.primaryText }]}>
              {stats.abertas}
            </Text>
            <Text style={styles.metricLabel}>Abertas</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: '#3B82F6' }]}>
              {stats.confirmadas}
            </Text>
            <Text style={styles.metricLabel}>Confirmadas</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: '#B91C1C' }]}>
              {stats.rejeitadas}
            </Text>
            <Text style={styles.metricLabel}>Rejeitadas</Text>
          </View>
        </View>

        {/* Seção: Score de Priorização */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="track-changes" size={20} color={AppColors.actionBlue} />
            <Text style={styles.sectionTitle}>Score de Priorização</Text>
          </View>
          <View style={styles.realtimeBadge}>
            <Text style={styles.realtimeText}>Tempo Real</Text>
          </View>
        </View>

        <View style={styles.scoreCard}>
          {/* Score geral da cidade */}
          <View style={styles.scoreSummary}>
            <View style={styles.scoreTopRow}>
              <Text style={styles.scoreLabel}>Score Geral de Risco</Text>
              <Text style={[styles.scoreValue, { color: NIVEL_CORES[score.nivelGeral].texto }]}>
                {denuncias ? `${score.geral}/100` : '–/100'}
              </Text>
            </View>
            <ScoreBar valor={score.geral} />
          </View>

          {/* Distritos mais críticos */}
          {erroDenuncias ? (
            <Text style={styles.scoreEmpty}>Não foi possível carregar as denúncias para calcular o score.</Text>
          ) : !denuncias ? (
            <Text style={styles.scoreEmpty}>Calculando o score...</Text>
          ) : score.totalConsideradas === 0 ? (
            <Text style={styles.scoreEmpty}>Nenhuma denúncia em aberto ou foco confirmado recente nos distritos.</Text>
          ) : (
            <View style={styles.districtsList}>
              {distritosExibidos.map((distrito) => (
                <DistritoRow
                  key={distrito.rpa}
                  distrito={distrito}
                  onDispatch={() => handleDispatchDistrict(`${distrito.nome} (${distrito.zona})`)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Seção: Módulos de Gestão */}
        <Text style={styles.modulesSectionTitle}>Módulos de Gestão</Text>

        <View style={styles.modulesGrid}>
          {/* Card 1: Dashboard */}
          <Pressable
            accessibilityRole="button"
            style={styles.moduleCard}
            onPress={() => handleModulePress('Dashboard')}>
            <View style={styles.moduleLeft}>
              <View style={[styles.moduleIconBox, { backgroundColor: '#EFF6FF' }]}>
                <MaterialIcons name="insert-chart" size={20} color={AppColors.actionBlue} />
              </View>
              <Text style={styles.moduleTitle}>Dashboard</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={AppColors.secondaryText} />
          </Pressable>

          {/* Card 2: Score & Pesos */}
          <Pressable
            accessibilityRole="button"
            style={styles.moduleCard}
            onPress={() => handleModulePress('Score & Pesos')}>
            <View style={styles.moduleLeft}>
              <View style={[styles.moduleIconBox, { backgroundColor: '#EEF2FF' }]}>
                <MaterialIcons name="tune" size={20} color="#4F46E5" />
              </View>
              <Text style={styles.moduleTitle}>Score & Pesos</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={AppColors.secondaryText} />
          </Pressable>

          {/* Card 3: Denúncias */}
          <Pressable
            accessibilityRole="button"
            style={styles.moduleCard}
            onPress={() => handleModulePress('Denúncias')}>
            <View style={styles.moduleLeft}>
              <View style={[styles.moduleIconBox, { backgroundColor: '#EFF6FF' }]}>
                <MaterialIcons name="assignment" size={20} color={AppColors.actionBlue} />
              </View>
              <Text style={styles.moduleTitle}>Denúncias</Text>
              <View style={styles.moduleCountBadge}>
                <Text style={styles.moduleCountText}>{stats.abertas}</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={AppColors.secondaryText} />
          </Pressable>

          {/* Card 4: Mapa Vetorial */}
          <Pressable
            accessibilityRole="button"
            style={styles.moduleCard}
            onPress={() => handleModulePress('Mapa Vetorial')}>
            <View style={styles.moduleLeft}>
              <View style={[styles.moduleIconBox, { backgroundColor: '#F0FDF4' }]}>
                <MaterialIcons name="map" size={20} color="#059669" />
              </View>
              <Text style={styles.moduleTitle}>Mapa Vetorial</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={AppColors.secondaryText} />
          </Pressable>
        </View>

        {/* Botão de Encerrar Sessão */}
        <Pressable
          accessibilityRole="button"
          style={styles.logoutButton}
          onPress={handleLogout}>
          <MaterialIcons name="logout" size={18} color={AppColors.highRisk} />
          <Text style={styles.logoutButtonText}>Encerrar Sessão do Agente</Text>
        </Pressable>

        {/* Rodapé Institucional */}
        <View style={styles.footer}>
          <View style={styles.footerBrandRow}>
            <View style={styles.susIconBox}>
              <MaterialIcons name="add" size={12} color="#FFFFFF" />
            </View>
            <Text style={styles.footerStrong}>SUS</Text>
            <Text style={styles.footerDot}>•</Text>
            <Text style={styles.footerText}>Prefeitura do Recife</Text>
          </View>
          <Text style={styles.footerCaption}>
            Iniciativa de apoio à Saúde Pública de Recife
          </Text>
        </View>
      </ScrollView>

      {/* Barra de Navegação Inferior (Início / Perfil) */}
      <View style={styles.bottomNav}>
        <Pressable
          accessibilityRole="button"
          style={styles.bottomNavItem}
          onPress={() => router.replace('/map')}>
          <MaterialIcons name="home" size={24} color={AppColors.secondaryText} />
          <Text style={styles.bottomNavLabel}>Início</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          style={styles.bottomNavItem}
          onPress={() => undefined}>
          <MaterialIcons name="account-circle" size={24} color={AppColors.actionBlue} />
          <Text style={[styles.bottomNavLabel, styles.bottomNavLabelSelected]}>Perfil</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// Barra do score geral: preenche até o valor, verde até o limite de risco médio, azul até o alto e vermelho acima.
function ScoreBar({ valor }: { valor: number }) {
  const verde = Math.min(valor, LIMITE_RISCO_MEDIO);
  const azul = Math.min(Math.max(valor - LIMITE_RISCO_MEDIO, 0), LIMITE_RISCO_ALTO - LIMITE_RISCO_MEDIO);
  const vermelho = Math.max(valor - LIMITE_RISCO_ALTO, 0);

  return (
    <View
      style={styles.progressBarContainer}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: valor }}>
      {verde > 0 && <View style={[styles.progressSegment, { flex: verde, backgroundColor: NIVEL_CORES.baixo.cor }]} />}
      {azul > 0 && <View style={[styles.progressSegment, { flex: azul, backgroundColor: NIVEL_CORES.medio.cor }]} />}
      {vermelho > 0 && (
        <View style={[styles.progressSegment, { flex: vermelho, backgroundColor: NIVEL_CORES.alto.cor }]} />
      )}
      {valor < 100 && <View style={{ flex: 100 - valor }} />}
    </View>
  );
}

function DistritoRow({ distrito, onDispatch }: { distrito: DistritoScore; onDispatch: () => void }) {
  const cores = NIVEL_CORES[distrito.nivel];

  return (
    <View style={[styles.districtCard, { borderLeftColor: cores.cor }]}>
      <View style={styles.districtInfo}>
        <View style={styles.districtNameRow}>
          <Text style={styles.districtName}>{distrito.nome}</Text>
          <Text style={styles.districtZone}> ({distrito.zona})</Text>
        </View>
        <Text style={[styles.districtRiskText, { color: cores.texto }]}>
          {distrito.risco}% risco{distrito.nivel === 'alto' ? ' alto' : ''}
        </Text>
      </View>
      {distrito.nivel === 'alto' ? (
        <Pressable accessibilityRole="button" style={styles.dispatchButton} onPress={onDispatch}>
          <MaterialIcons name="campaign" size={16} color="#FFFFFF" />
          <Text style={styles.dispatchButtonText}>Despachar</Text>
        </Pressable>
      ) : (
        <View style={[styles.districtBadge, { backgroundColor: cores.fundo }]}>
          <Text style={[styles.districtBadgeText, { color: cores.texto }]}>{cores.rotulo}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  institutionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#E0EDFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: AppColors.primaryText,
  },
  headerSubtitle: {
    fontSize: 12,
    color: AppColors.secondaryText,
    marginTop: 2,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    marginBottom: 18,
  },
  metricCard: {
    flex: 1,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 12,
    color: AppColors.secondaryText,
    marginTop: 4,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.primaryText,
  },
  realtimeBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  realtimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  scoreCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  scoreSummary: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  scoreEmpty: {
    fontSize: 13,
    color: AppColors.secondaryText,
    textAlign: 'center',
    paddingVertical: 8,
  },
  scoreTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scoreLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: AppColors.inactive,
  },
  progressSegment: {
    height: '100%',
  },
  districtsList: {
    gap: 10,
  },
  districtCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  districtInfo: {
    flex: 1,
  },
  districtNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  districtName: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.primaryText,
  },
  districtZone: {
    fontSize: 12,
    color: AppColors.secondaryText,
  },
  districtRiskText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  dispatchButton: {
    backgroundColor: '#B91C1C',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dispatchButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  districtBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  districtBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modulesSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: AppColors.primaryText,
    marginBottom: 12,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  moduleCard: {
    width: '48.5%',
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  moduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  moduleIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.primaryText,
  },
  moduleCountBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 2,
  },
  moduleCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E40AF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    marginTop: 6,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: AppColors.highRisk,
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    gap: 4,
    paddingBottom: 16,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  susIconBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: AppColors.actionBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerStrong: {
    fontSize: 12,
    fontWeight: '800',
    color: AppColors.actionBlue,
  },
  footerDot: {
    fontSize: 12,
    color: AppColors.secondaryText,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.secondaryText,
  },
  footerCaption: {
    fontSize: 11,
    color: '#94A3B8',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: AppColors.surface,
    borderTopWidth: 1,
    borderTopColor: AppColors.inactive,
    paddingVertical: 8,
    paddingHorizontal: 40,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  bottomNavItem: {
    alignItems: 'center',
    gap: 3,
  },
  bottomNavLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.secondaryText,
  },
  bottomNavLabelSelected: {
    color: AppColors.actionBlue,
    fontWeight: '700',
  },
});
