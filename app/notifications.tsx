import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, Fonts } from '@/constants/theme';
import { useAuth } from '@/src/contexts/auth-context';
import {
  listarNotificacoes,
  obterResumoBairro,
  listarBairrosRecife,
  obterEstatisticasGerais,
  type BairroOpcao,
  type EstatisticasGeraisNotificacoes,
} from '@/src/services/notification-service';
import type {
  NotificacaoBairro,
  ResumoBairroEpidemiologico,
  CategoriaNotificacao,
  NivelRiscoEpidemiologico,
} from '@/src/types';

interface CategoriaFiltroOpcao {
  chave: CategoriaNotificacao | 'todas';
  rotulo: string;
  icone: keyof typeof MaterialIcons.glyphMap;
}

const CATEGORIAS_FILTRO: CategoriaFiltroOpcao[] = [
  { chave: 'todas', rotulo: 'Todos', icone: 'apps' },
  { chave: 'alerta_foco', rotulo: 'Focos', icone: 'warning-amber' },
  { chave: 'mutirao_saude', rotulo: 'Mutirões', icone: 'campaign' },
  { chave: 'caso_confirmado', rotulo: 'Casos', icone: 'medical-services' },
  { chave: 'orientacao_sanitaria', rotulo: 'Prevenção', icone: 'water-drop' },
  { chave: 'fumace_bloqueio', rotulo: 'Fumacê', icone: 'cloud-queue' },
];

export default function NotificationsScreen() {
  const { usuario, carregando: carregandoAuth } = useAuth();
  const router = useRouter();

  const [notificacoes, setNotificacoes] = useState<NotificacaoBairro[]>([]);
  const [bairroSelecionado, setBairroSelecionado] = useState<string | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<CategoriaNotificacao | 'todas'>(
    'todas'
  );
  const [resumoBairro, setResumoBairro] = useState<ResumoBairroEpidemiologico | null>(null);
  const [estatisticasGerais, setEstatisticasGerais] =
    useState<EstatisticasGeraisNotificacoes | null>(null);

  const [readIds, setReadIds] = useState<string[]>([]);
  const [carregandoDados, setCarregandoDados] = useState<boolean>(true);
  const [atualizando, setAtualizando] = useState<boolean>(false);
  const [modalBairrosVisivel, setModalBairrosVisivel] = useState<boolean>(false);
  const [termoBuscaBairro, setTermoBuscaBairro] = useState<string>('');

  const todosBairros = useMemo(() => listarBairrosRecife(), []);

  const bairrosFiltrados = useMemo(() => {
    if (!termoBuscaBairro.trim()) {
      return todosBairros;
    }
    const termo = termoBuscaBairro.toLowerCase();
    return todosBairros.filter(
      (b) => b.nome.toLowerCase().includes(termo) || b.rpa.toLowerCase().includes(termo)
    );
  }, [todosBairros, termoBuscaBairro]);

  const carregarDados = useCallback(async (bairro: string | null, isRefresh = false) => {
    if (isRefresh) {
      setAtualizando(true);
    } else {
      setCarregandoDados(true);
    }

    try {
      const lista = await listarNotificacoes(bairro);
      setNotificacoes(lista);

      if (bairro) {
        const resumo = await obterResumoBairro(bairro);
        setResumoBairro(resumo);
      } else {
        setResumoBairro(null);
        setEstatisticasGerais(obterEstatisticasGerais());
      }
    } catch (error) {
      console.error('Erro ao carregar notificações por bairro:', error);
    } finally {
      setCarregandoDados(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados(bairroSelecionado);
  }, [bairroSelecionado, carregarDados]);

  const notificacoesExibidas = useMemo(() => {
    if (categoriaSelecionada === 'todas') {
      return notificacoes;
    }
    return notificacoes.filter((n) => n.categoria === categoriaSelecionada);
  }, [notificacoes, categoriaSelecionada]);

  const unreadCount = notificacoesExibidas.filter((item) => !readIds.includes(item.id)).length;

  function markAllAsRead() {
    setReadIds((prev) => [...new Set([...prev, ...notificacoesExibidas.map((i) => i.id)])]);
  }

  function handleSelectBairro(bairro: string | null) {
    setBairroSelecionado(bairro);
    setModalBairrosVisivel(false);
    setTermoBuscaBairro('');
  }

  if (carregandoAuth) {
    return (
      <SafeAreaView style={styles.loadingState}>
        <ActivityIndicator size="large" color={AppColors.actionBlue} />
        <Text style={styles.loadingLabel}>Carregando notificações...</Text>
      </SafeAreaView>
    );
  }

  if (!usuario) {
    return <Redirect href="/login" />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => carregarDados(bairroSelecionado, true)}
            colors={[AppColors.actionBlue]}
          />
        }>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Voltar para a tela anterior"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={AppColors.primaryText} />
          </Pressable>
          <Image
            source={require('@/assets/images/vetor-risco-logo.png')}
            contentFit="contain"
            style={styles.logo}
          />
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Notificações Por Bairro</Text>
            <Text style={styles.headerSubtitle}>Vigilância Epidemiológica</Text>
          </View>
          <Text style={styles.city}>RECIFE</Text>
        </View>

        {/* Seletor do Bairro (Filtro Ativo) */}
        <View style={styles.bairroSelectorSection}>
          <Text style={styles.sectionSmallLabel}>LOCALIZAÇÃO DE INTERESSE</Text>
          <Pressable
            style={styles.bairroSelectorButton}
            accessibilityRole="button"
            onPress={() => setModalBairrosVisivel(true)}>
            <View style={styles.bairroSelectorIcon}>
              <MaterialIcons name="place" size={20} color={AppColors.actionBlue} />
            </View>
            <View style={styles.bairroSelectorText}>
              <Text style={styles.bairroSelectorTitle}>
                {bairroSelecionado ? bairroSelecionado : 'Todos os Bairros do Recife'}
              </Text>
              <Text style={styles.bairroSelectorSub}>
                {bairroSelecionado && resumoBairro
                  ? `${resumoBairro.rpa} • Microrregião ${resumoBairro.micro}`
                  : 'Visão geral epidemiológica de toda a capital'}
              </Text>
            </View>
            <View style={styles.bairroSelectorAction}>
              <Text style={styles.changeLabel}>Alterar</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={AppColors.actionBlue} />
            </View>
          </Pressable>
        </View>

        {/* Card Epidemiológico de Resumo */}
        {resumoBairro ? (
          <View style={styles.epidemiologyCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.riskBadgeContainer}>
                <RiskBadge nivel={resumoBairro.nivelRisco} />
              </View>
              <Text style={styles.rpaBadgeText}>{resumoBairro.rpa}</Text>
            </View>

            <Text style={styles.epidemiologyStatusTitle}>{resumoBairro.statusDescricao}</Text>

            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricNum}>{resumoBairro.indiceInfestacaoPredial}%</Text>
                <Text style={styles.metricDesc}>Índice Predial (IIP)</Text>
              </View>
              <View style={styles.metricBoxDivider} />
              <View style={styles.metricBox}>
                <Text style={styles.metricNum}>{resumoBairro.casosEstimados}</Text>
                <Text style={styles.metricDesc}>Casos Recentes</Text>
              </View>
              <View style={styles.metricBoxDivider} />
              <View style={styles.metricBox}>
                <Text style={styles.metricNum}>{resumoBairro.totalAlertas}</Text>
                <Text style={styles.metricDesc}>Alertas Ativos</Text>
              </View>
            </View>

            {resumoBairro.temMutiraoAgendado ? (
              <View style={styles.mutiraoNotice}>
                <MaterialIcons name="event-available" size={16} color="#0D9488" />
                <Text style={styles.mutiraoNoticeText}>
                  Mutirão comunitário de limpeza agendado pela Secretaria de Saúde.
                </Text>
              </View>
            ) : null}
          </View>
        ) : estatisticasGerais ? (
          <View style={styles.generalStatsCard}>
            <View style={styles.generalStatsHeader}>
              <MaterialIcons name="analytics" size={18} color={AppColors.actionBlue} />
              <Text style={styles.generalStatsTitle}>Panorama de Arboviroses Recife</Text>
            </View>
            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricNum}>{estatisticasGerais.totalAlertas}</Text>
                <Text style={styles.metricDesc}>Total Alertas</Text>
              </View>
              <View style={styles.metricBoxDivider} />
              <View style={styles.metricBox}>
                <Text style={[styles.metricNum, { color: '#EF4444' }]}>
                  {estatisticasGerais.bairrosEmRiscoAlto}
                </Text>
                <Text style={styles.metricDesc}>Bairros em Risco Alto</Text>
              </View>
              <View style={styles.metricBoxDivider} />
              <View style={styles.metricBox}>
                <Text style={[styles.metricNum, { color: AppColors.actionBlue }]}>
                  {estatisticasGerais.mutiroesAtivos}
                </Text>
                <Text style={styles.metricDesc}>Mutirões Ativos</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Filtro por Categorias (Chips) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChipsScroll}>
          {CATEGORIAS_FILTRO.map((cat) => {
            const isSelected = categoriaSelecionada === cat.chave;
            return (
              <Pressable
                key={cat.chave}
                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                onPress={() => setCategoriaSelecionada(cat.chave)}>
                <MaterialIcons
                  name={cat.icone}
                  size={15}
                  color={isSelected ? '#FFFFFF' : AppColors.secondaryText}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextSelected,
                  ]}>
                  {cat.rotulo}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Linha de Resumo de Leitura */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCopy}>
            <View style={[styles.summaryDot, unreadCount === 0 && styles.summaryDotRead]} />
            <Text style={styles.summaryLabel}>
              {unreadCount} {unreadCount === 1 ? 'alerta ativo' : 'alertas ativos'}
              {bairroSelecionado ? ` em ${bairroSelecionado}` : ' no Recife'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={markAllAsRead}
            disabled={unreadCount === 0}>
            <Text style={[styles.markReadLabel, unreadCount === 0 && styles.disabledLabel]}>
              ✓ Marcar como lidas
            </Text>
          </Pressable>
        </View>

        {/* Lista de Notificações */}
        {carregandoDados ? (
          <View style={styles.loadingInner}>
            <ActivityIndicator size="small" color={AppColors.actionBlue} />
            <Text style={styles.loadingLabel}>Consultando dataset municipal...</Text>
          </View>
        ) : notificacoesExibidas.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <MaterialIcons name="check-circle-outline" size={44} color="#10B981" />
            <Text style={styles.emptyStateTitle}>Nenhum alerta crítico ativo</Text>
            <Text style={styles.emptyStateSubtitle}>
              {bairroSelecionado
                ? `O bairro ${bairroSelecionado} não possui alertas pendentes para a categoria selecionada.`
                : 'Não há notificações registradas para este filtro no momento.'}
            </Text>
            {bairroSelecionado ? (
              <Pressable
                style={styles.emptyStateButton}
                onPress={() => handleSelectBairro(null)}>
                <Text style={styles.emptyStateButtonText}>Ver todos os bairros</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.notificationList}>
            {notificacoesExibidas.map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                read={readIds.includes(item.id)}
                onRead={() => setReadIds((current) => [...new Set([...current, item.id])])}
              />
            ))}
          </View>
        )}

        {/* Informações da Vigilância e SUS */}
        <View style={styles.infoBanner}>
          <View style={styles.infoIconBox}>
            <MaterialIcons name="shield" size={20} color={AppColors.actionBlue} />
          </View>
          <View style={styles.infoTextBox}>
            <Text style={styles.infoTitle}>Vigilância Ambiental do Recife</Text>
            <Text style={styles.infoDesc}>
              Os alertas são consolidados a partir das denúncias no VetorRisco e dos ciclos de
              inspeção do LIRAa da Secretaria Municipal de Saúde.
            </Text>
          </View>
        </View>

        {/* Rodapé SUS • Prefeitura */}
        <View style={styles.footer}>
          <View style={styles.footerBrandRow}>
            <MaterialIcons name="local-hospital" size={13} color={AppColors.actionBlue} />
            <Text style={styles.footerStrong}>SUS</Text>
            <Text style={styles.footerDot}>•</Text>
            <Text style={styles.footerText}>Prefeitura do Recife</Text>
          </View>
          <Text style={styles.footerCaption}>
            Plataforma Integrada de Combate às Arboviroses (Dengue, Chikungunya, Zika)
          </Text>
        </View>
      </ScrollView>

      {/* Modal de Seleção de Bairro */}
      <Modal
        visible={modalBairrosVisivel}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalBairrosVisivel(false)}>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleBox}>
                <Text style={styles.modalTitle}>Filtrar Notificações por Bairro</Text>
                <Text style={styles.modalSubtitle}>94 Bairros Oficiais do Recife</Text>
              </View>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setModalBairrosVisivel(false)}>
                <MaterialIcons name="close" size={22} color={AppColors.primaryText} />
              </Pressable>
            </View>

            {/* Barra de Busca de Bairro */}
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={20} color={AppColors.secondaryText} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar bairro ou RPA (ex: Várzea, Ibura, RPA 4)..."
                placeholderTextColor="#94A3B8"
                value={termoBuscaBairro}
                onChangeText={setTermoBuscaBairro}
                autoCorrect={false}
              />
              {termoBuscaBairro.length > 0 ? (
                <Pressable onPress={() => setTermoBuscaBairro('')}>
                  <MaterialIcons name="cancel" size={18} color="#94A3B8" />
                </Pressable>
              ) : null}
            </View>

            {/* Opção Todos os Bairros */}
            <Pressable
              style={[
                styles.bairroOptionItem,
                bairroSelecionado === null && styles.bairroOptionSelected,
              ]}
              onPress={() => handleSelectBairro(null)}>
              <View style={styles.bairroOptionLeft}>
                <View style={styles.allBairrosIcon}>
                  <MaterialIcons name="public" size={18} color={AppColors.actionBlue} />
                </View>
                <View>
                  <Text style={styles.bairroOptionName}>Todos os bairros (Recife)</Text>
                  <Text style={styles.bairroOptionMeta}>Visão geral da capital inteira</Text>
                </View>
              </View>
              {bairroSelecionado === null ? (
                <MaterialIcons name="check" size={20} color={AppColors.actionBlue} />
              ) : null}
            </Pressable>

            {/* Lista com os Bairros do Recife */}
            <ScrollView style={styles.bairrosListScroll} keyboardShouldPersistTaps="handled">
              {bairrosFiltrados.map((b) => {
                const isSelected = bairroSelecionado === b.nome;
                return (
                  <Pressable
                    key={b.nome}
                    style={[styles.bairroOptionItem, isSelected && styles.bairroOptionSelected]}
                    onPress={() => handleSelectBairro(b.nome)}>
                    <View style={styles.bairroOptionLeft}>
                      <View>
                        <Text style={styles.bairroOptionName}>{b.nome}</Text>
                        <Text style={styles.bairroOptionMeta}>
                          {b.rpa} • Micro {b.micro}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.bairroOptionRight}>
                      {b.totalAlertas > 0 ? (
                        <View style={styles.alertCounterBadge}>
                          <Text style={styles.alertCounterText}>
                            {b.totalAlertas} {b.totalAlertas === 1 ? 'alerta' : 'alertas'}
                          </Text>
                        </View>
                      ) : null}
                      {isSelected ? (
                        <MaterialIcons name="check" size={20} color={AppColors.actionBlue} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

interface RiskBadgeProps {
  nivel: NivelRiscoEpidemiologico;
}

function RiskBadge({ nivel }: RiskBadgeProps) {
  let bg = '#FEF2F2';
  let color = '#EF4444';
  let rotulo = 'Risco Alto';

  if (nivel === 'medio') {
    bg = '#FEF3C7';
    color = '#D97706';
    rotulo = 'Risco Médio';
  } else if (nivel === 'baixo') {
    bg = '#ECFDF5';
    color = '#059669';
    rotulo = 'Risco Baixo';
  }

  return (
    <View style={[styles.riskBadge, { backgroundColor: bg }]}>
      <View style={[styles.riskBadgeDot, { backgroundColor: color }]} />
      <Text style={[styles.riskBadgeText, { color }]}>{rotulo}</Text>
    </View>
  );
}

interface NotificationCardProps {
  item: NotificacaoBairro;
  read: boolean;
  onRead: () => void;
}

function NotificationCard({ item, read, onRead }: NotificationCardProps) {
  const metaBadgeInfo = useMemo(() => {
    switch (item.categoria) {
      case 'alerta_foco':
        return {
          icon: 'warning-amber' as const,
          label: 'Foco de Mosquito',
          accent: '#EF4444',
          bg: '#FEE2E2',
        };
      case 'mutirao_saude':
        return {
          icon: 'campaign' as const,
          label: 'Mutirão de Saúde',
          accent: AppColors.actionBlue,
          bg: '#E0EAFF',
        };
      case 'caso_confirmado':
        return {
          icon: 'medical-services' as const,
          label: 'Casos Notificados',
          accent: '#DC2626',
          bg: '#FEE2E2',
        };
      case 'orientacao_sanitaria':
        return {
          icon: 'water-drop' as const,
          label: 'Prevenção Sanitária',
          accent: '#059669',
          bg: '#D1FAE5',
        };
      case 'fumace_bloqueio':
        return {
          icon: 'cloud-queue' as const,
          label: 'Aplicação de Fumacê',
          accent: '#7C3AED',
          bg: '#EDE9FE',
        };
      default:
        return {
          icon: 'notifications' as const,
          label: 'Alerta Sanitário',
          accent: AppColors.securityBlue,
          bg: '#E7ECFF',
        };
    }
  }, [item.categoria]);

  return (
    <Pressable
      style={[styles.notificationCard, read && styles.readCard]}
      accessibilityRole="button"
      onPress={onRead}>
      <View style={[styles.cardAccent, { backgroundColor: metaBadgeInfo.accent }]} />
      <View style={styles.cardContent}>
        {/* Linha de topo: Categoria, Bairro e Horário */}
        <View style={styles.cardMetaRow}>
          <View style={[styles.categoryBadge, { backgroundColor: metaBadgeInfo.bg }]}>
            <MaterialIcons name={metaBadgeInfo.icon} size={13} color={metaBadgeInfo.accent} />
            <Text style={[styles.categoryLabel, { color: metaBadgeInfo.accent }]}>
              {metaBadgeInfo.label}
            </Text>
          </View>
          <View style={styles.bairroBadge}>
            <MaterialIcons name="place" size={12} color={AppColors.secondaryText} />
            <Text style={styles.bairroBadgeText}>
              {item.bairro} • {item.rpa}
            </Text>
          </View>
        </View>

        <Text style={styles.notificationTitle}>{item.titulo}</Text>
        <Text style={styles.notificationBody}>{item.descricao}</Text>

        {/* Indicadores adicionais do alerta */}
        {item.indiceInfestacao || item.casosRecentes ? (
          <View style={styles.cardIndicatorsRow}>
            {item.indiceInfestacao ? (
              <View style={styles.indicatorPill}>
                <Text style={styles.indicatorPillLabel}>IIP:</Text>
                <Text style={styles.indicatorPillVal}>{item.indiceInfestacao}</Text>
              </View>
            ) : null}
            {item.casosRecentes ? (
              <View style={styles.indicatorPill}>
                <Text style={styles.indicatorPillLabel}>Casos:</Text>
                <Text style={styles.indicatorPillVal}>+{item.casosRecentes}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {item.recomendacao ? (
          <View style={styles.recommendation}>
            <MaterialIcons name="check-circle" size={15} color={AppColors.actionBlue} />
            <Text style={styles.recommendationText}>{item.recomendacao}</Text>
          </View>
        ) : null}

        <View style={styles.cardBottomRow}>
          {item.badge ? (
            <View style={styles.cardBadgeRow}>
              <MaterialIcons name="shield" size={13} color={AppColors.securityBlue} />
              <Text style={styles.cardBadgeText}>{item.badge}</Text>
            </View>
          ) : (
            <View />
          )}

          <View style={styles.dateRow}>
            <MaterialIcons name="schedule" size={12} color={AppColors.secondaryText} />
            <Text style={styles.dateLabel}>{item.meta}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F8F7FF',
  },
  loadingInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  loadingLabel: {
    color: AppColors.secondaryText,
    fontSize: 13,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 36,
  },
  header: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E5F0',
    backgroundColor: '#FDFDFF',
  },
  logo: {
    width: 26,
    height: 32,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    color: AppColors.primaryText,
    fontFamily: Fonts?.sans,
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: AppColors.secondaryText,
    fontSize: 11,
  },
  city: {
    color: AppColors.actionBlue,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  bairroSelectorSection: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  sectionSmallLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingLeft: 2,
  },
  bairroSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  bairroSelectorIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bairroSelectorText: {
    flex: 1,
  },
  bairroSelectorTitle: {
    color: AppColors.primaryText,
    fontSize: 15,
    fontWeight: '700',
  },
  bairroSelectorSub: {
    color: AppColors.secondaryText,
    fontSize: 11,
    marginTop: 2,
  },
  bairroSelectorAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 6,
  },
  changeLabel: {
    color: AppColors.actionBlue,
    fontSize: 12,
    fontWeight: '600',
  },
  epidemiologyCard: {
    marginHorizontal: 14,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskBadgeContainer: {
    flexDirection: 'row',
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rpaBadgeText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  epidemiologyStatusTitle: {
    color: AppColors.primaryText,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 10,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricBoxDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  metricNum: {
    color: AppColors.primaryText,
    fontSize: 16,
    fontWeight: '800',
  },
  metricDesc: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  mutiraoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0FDFA',
  },
  mutiraoNoticeText: {
    flex: 1,
    color: '#0F766E',
    fontSize: 11,
    lineHeight: 15,
  },
  generalStatsCard: {
    marginHorizontal: 14,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  generalStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  generalStatsTitle: {
    color: AppColors.primaryText,
    fontSize: 13,
    fontWeight: '700',
  },
  categoryChipsScroll: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipSelected: {
    backgroundColor: AppColors.actionBlue,
    borderColor: AppColors.actionBlue,
  },
  categoryChipText: {
    color: AppColors.secondaryText,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  summaryRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  summaryCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  summaryDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: AppColors.actionBlue,
  },
  summaryDotRead: {
    backgroundColor: '#CBD5E1',
  },
  summaryLabel: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '500',
  },
  markReadLabel: {
    color: AppColors.actionBlue,
    fontSize: 11,
    fontWeight: '600',
  },
  disabledLabel: {
    color: '#94A3B8',
  },
  notificationList: {
    gap: 12,
    paddingHorizontal: 14,
  },
  notificationCard: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    borderRadius: 14,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  readCard: {
    opacity: 0.68,
  },
  cardAccent: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    gap: 8,
    padding: 14,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  bairroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  bairroBadgeText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  notificationTitle: {
    color: AppColors.primaryText,
    fontFamily: Fonts?.sans,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  notificationBody: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
  },
  cardIndicatorsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  indicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  indicatorPillLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  indicatorPillVal: {
    color: AppColors.primaryText,
    fontSize: 10,
    fontWeight: '700',
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 2,
    borderLeftColor: AppColors.actionBlue,
  },
  recommendationText: {
    flex: 1,
    color: '#1E3A8A',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardBadgeText: {
    color: AppColors.securityBlue,
    fontSize: 10,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dateLabel: {
    color: '#94A3B8',
    fontSize: 10,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyStateTitle: {
    color: AppColors.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyStateSubtitle: {
    color: AppColors.secondaryText,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyStateButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  emptyStateButtonText: {
    color: AppColors.actionBlue,
    fontSize: 12,
    fontWeight: '600',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginHorizontal: 14,
    marginTop: 18,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextBox: {
    flex: 1,
  },
  infoTitle: {
    color: '#1E3A8A',
    fontSize: 12,
    fontWeight: '700',
  },
  infoDesc: {
    color: '#3B82F6',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 36,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerStrong: {
    color: AppColors.primaryText,
    fontSize: 10,
    fontWeight: '700',
  },
  footerDot: {
    color: AppColors.secondaryText,
    fontSize: 10,
  },
  footerText: {
    color: AppColors.secondaryText,
    fontSize: 10,
  },
  footerCaption: {
    marginTop: 4,
    color: '#94A3B8',
    fontSize: 9,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderTitleBox: {
    flex: 1,
  },
  modalTitle: {
    color: AppColors.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: AppColors.secondaryText,
    fontSize: 11,
    marginTop: 1,
  },
  modalCloseButton: {
    padding: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    color: AppColors.primaryText,
    fontSize: 13,
    padding: 0,
  },
  bairrosListScroll: {
    paddingHorizontal: 12,
    maxHeight: 380,
  },
  bairroOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  bairroOptionSelected: {
    backgroundColor: '#EFF6FF',
  },
  bairroOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  allBairrosIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bairroOptionName: {
    color: AppColors.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  bairroOptionMeta: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  bairroOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertCounterBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  alertCounterText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
  },
});
