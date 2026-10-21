import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs } from 'firebase/firestore';

import { AppColors } from '@/constants/theme';
import { db } from '@/src/services/firebase';
import type { Usuario } from '@/src/types';
import { useAuth } from '@/src/contexts/auth-context';

interface PrefeituraProfileViewProps {
  usuario: Usuario;
}

interface DenunciaStats {
  abertas: number;
  emAnalise: number;
  resolvidas: number;
}

export function PrefeituraProfileView({ usuario }: PrefeituraProfileViewProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [stats, setStats] = useState<DenunciaStats>({
    abertas: 128,
    emAnalise: 43,
    resolvidas: 85,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const denunciasRef = collection(db, 'denuncias');
        const snapshot = await getDocs(denunciasRef);

        if (!snapshot.empty) {
          let abertas = 0;
          let emAnalise = 0;
          let resolvidas = 0;

          snapshot.forEach((doc) => {
            const data = doc.data();
            const status = data.statusDenuncia;

            if (status === 'pendente') {
              abertas++;
            } else if (status === 'em_analise') {
              emAnalise++;
            } else if (status === 'confirmada' || status === 'descartada') {
              resolvidas++;
            }
          });

          // Se existirem denúncias no Firestore, atualiza com os dados reais
          if (abertas > 0 || emAnalise > 0 || resolvidas > 0) {
            setStats({ abertas, emAnalise, resolvidas });
          }
        }
      } catch {
        // Mantém valores padrão de demonstração do Figma em caso de regras/offline
      }
    }

    loadStats();
  }, []);

  function handleDispatchDistrict(districtName: string) {
    Alert.alert(
      'Equipe de Campo',
      `Equipe de Agentes de Saúde despachada com sucesso para inspeção no ${districtName}!`,
      [{ text: 'OK' }]
    );
  }

  function handleModulePress(moduleName: string) {
    if (moduleName === 'Mapa Vetorial') {
      router.replace('/map');
    } else if (moduleName === 'Denúncias') {
      Alert.alert(
        'Módulo de Denúncias',
        `Existem ${stats.abertas} denúncias aguardando inspeção municipal no Grande Recife.`,
        [
          { text: 'Ver no Mapa', onPress: () => router.replace('/map') },
          { text: 'Fechar', style: 'cancel' },
        ]
      );
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

        {/* Linha de Métricas (Abertas, Em análise, Resolvidas) */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: AppColors.primaryText }]}>
              {stats.abertas}
            </Text>
            <Text style={styles.metricLabel}>Abertas</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: '#3B82F6' }]}>
              {stats.emAnalise}
            </Text>
            <Text style={styles.metricLabel}>Em análise</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: '#10B981' }]}>
              {stats.resolvidas}
            </Text>
            <Text style={styles.metricLabel}>Resolvidas</Text>
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
          {/* Linha do Score Geral */}
          <View style={styles.scoreTopRow}>
            <Text style={styles.scoreLabel}>Score Geral de Risco</Text>
            <Text style={styles.scoreValue}>78/100</Text>
          </View>

          {/* Barra de Progresso Tricolor */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressSegment, { flex: 33, backgroundColor: '#10B981' }]} />
            <View style={[styles.progressSegment, { flex: 33, backgroundColor: '#60A5FA' }]} />
            <View style={[styles.progressSegment, { flex: 34, backgroundColor: '#DC2626' }]} />
          </View>

          {/* Lista de Distritos */}
          <View style={styles.districtsList}>
            {/* Distrito II */}
            <View style={[styles.districtCard, { borderLeftColor: '#DC2626' }]}>
              <View style={styles.districtInfo}>
                <View style={styles.districtNameRow}>
                  <Text style={styles.districtName}>Distrito II</Text>
                  <Text style={styles.districtZone}> (Zona Norte)</Text>
                </View>
                <Text style={[styles.districtRiskText, { color: '#DC2626' }]}>
                  88% risco alto
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                style={styles.dispatchButton}
                onPress={() => handleDispatchDistrict('Distrito II (Zona Norte)')}>
                <MaterialIcons name="campaign" size={16} color="#FFFFFF" />
                <Text style={styles.dispatchButtonText}>Despachar</Text>
              </Pressable>
            </View>

            {/* Distrito IV */}
            <View style={[styles.districtCard, { borderLeftColor: '#3B82F6' }]}>
              <View style={styles.districtInfo}>
                <View style={styles.districtNameRow}>
                  <Text style={styles.districtName}>Distrito IV</Text>
                  <Text style={styles.districtZone}> (Caxangá/Iputinga)</Text>
                </View>
                <Text style={[styles.districtRiskText, { color: '#2563EB' }]}>
                  54% risco
                </Text>
              </View>
              <View style={[styles.districtBadge, { backgroundColor: '#EFF6FF' }]}>
                <Text style={[styles.districtBadgeText, { color: '#2563EB' }]}>Média</Text>
              </View>
            </View>

            {/* Distrito VI */}
            <View style={[styles.districtCard, { borderLeftColor: '#10B981' }]}>
              <View style={styles.districtInfo}>
                <View style={styles.districtNameRow}>
                  <Text style={styles.districtName}>Distrito VI</Text>
                  <Text style={styles.districtZone}> (Boa Viagem)</Text>
                </View>
                <Text style={[styles.districtRiskText, { color: '#059669' }]}>
                  18% risco
                </Text>
              </View>
              <View style={[styles.districtBadge, { backgroundColor: '#ECFDF5' }]}>
                <Text style={[styles.districtBadgeText, { color: '#059669' }]}>Baixa</Text>
              </View>
            </View>
          </View>
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
    color: '#DC2626',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressSegment: {
    height: '100%',
  },
  districtsList: {
    gap: 10,
  },
  districtCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
