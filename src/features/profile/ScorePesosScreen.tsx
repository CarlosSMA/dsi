import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import {
  calcularScorePriorizacao,
  DIAS_CONFIRMADA_RECENTE,
  DIAS_PENDENTE_ATRASADA,
  LIMITE_RISCO_ALTO,
  LIMITE_RISCO_MEDIO,
  NIVEL_CORES,
  PESOS,
  PONTOS_ESCALA,
  type DistritoScore,
} from '@/src/features/profile/utils/score-priorizacao';
import { Denuncias } from '@/src/models/Denuncia';
import type { Denuncia } from '@/src/types';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

const REGRAS_PESO: { icon: IconName; cor: string; titulo: string; descricao: string; peso: number }[] = [
  {
    icon: 'check-circle',
    cor: AppColors.highRisk,
    titulo: 'Foco confirmado',
    descricao: `Denúncia confirmada nos últimos ${DIAS_CONFIRMADA_RECENTE} dias`,
    peso: PESOS.confirmadaRecente,
  },
  {
    icon: 'hourglass-bottom',
    cor: AppColors.attention,
    titulo: 'Pendente atrasada',
    descricao: `Aguardando avaliação há mais de ${DIAS_PENDENTE_ATRASADA} dias`,
    peso: PESOS.pendenteAtrasada,
  },
  {
    icon: 'schedule',
    cor: AppColors.actionBlue,
    titulo: 'Pendente',
    descricao: `Aguardando avaliação há até ${DIAS_PENDENTE_ATRASADA} dias`,
    peso: PESOS.pendente,
  },
  {
    icon: 'cancel',
    cor: AppColors.secondaryText,
    titulo: 'Rejeitada',
    descricao: 'Não indica risco e não entra no cálculo',
    peso: 0,
  },
];

// Tela de consulta do score de priorização: mostra os pesos usados e o cálculo de cada distrito.
export function ScorePesosScreen() {
  const router = useRouter();
  const [denuncias, setDenuncias] = useState<Denuncia[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(
    () =>
      Denuncias.observar(
        (lista) => {
          setDenuncias(lista);
          setErro(false);
        },
        (error) => {
          console.error('Não foi possível carregar as denúncias.', error);
          setErro(true);
        }
      ),
    []
  );

  const score = useMemo(() => calcularScorePriorizacao(denuncias ?? []), [denuncias]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Voltar para o perfil da prefeitura"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/prefeitura-profile' as Href))}
          style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={AppColors.primaryText} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Score & Pesos</Text>
          <Text style={styles.subtitle}>Como a prioridade dos distritos é calculada</Text>
        </View>
        <View style={styles.headerIcon}>
          <MaterialIcons name="tune" size={22} color="#4F46E5" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Resumo do score geral */}
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>Score Geral de Risco</Text>
            <Text style={styles.summaryCaption}>Média dos 6 distritos</Text>
          </View>
          <Text style={[styles.summaryValue, { color: NIVEL_CORES[score.nivelGeral].texto }]}>
            {denuncias ? score.geral : '–'}
            <Text style={styles.summaryMax}>/100</Text>
          </Text>
        </View>

        {/* Pesos */}
        <Text style={styles.sectionTitle}>Pesos por denúncia</Text>
        <View style={styles.panel}>
          {REGRAS_PESO.map((regra, index) => (
            <View key={regra.titulo} style={[styles.weightRow, index > 0 && styles.rowDivider]}>
              <MaterialIcons name={regra.icon} size={22} color={regra.cor} />
              <View style={styles.weightText}>
                <Text style={styles.weightTitle}>{regra.titulo}</Text>
                <Text style={styles.weightDescription}>{regra.descricao}</Text>
              </View>
              <View style={[styles.weightBadge, regra.peso === 0 && styles.weightBadgeZero]}>
                <Text style={[styles.weightBadgeText, regra.peso === 0 && styles.weightBadgeTextZero]}>
                  {regra.peso === 0 ? '0 pt' : `+${regra.peso} pts`}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Fórmula e níveis */}
        <Text style={styles.sectionTitle}>Do total de pontos ao risco</Text>
        <View style={styles.panel}>
          <Text style={styles.paragraph}>
            Cada denúncia soma pontos ao distrito (RPA) onde foi registrada. Os pontos viram um risco de 0 a 100%
            que cresce rápido nos primeiros casos e se aproxima de 100% aos poucos: com {PONTOS_ESCALA} pontos o
            distrito fica em 63% e, com {PONTOS_ESCALA * 2}, em 86%.
          </Text>
          <View style={styles.levelsRow}>
            <NivelChip nivel="baixo" faixa={`0–${LIMITE_RISCO_MEDIO - 1}%`} />
            <NivelChip nivel="medio" faixa={`${LIMITE_RISCO_MEDIO}–${LIMITE_RISCO_ALTO - 1}%`} />
            <NivelChip nivel="alto" faixa={`${LIMITE_RISCO_ALTO}–100%`} />
          </View>
          <Text style={styles.footnote}>Distritos com risco alto podem receber o despacho de uma equipe de campo.</Text>
        </View>

        {/* Detalhamento por distrito */}
        <Text style={styles.sectionTitle}>Cálculo por distrito</Text>
        {erro ? (
          <Text style={styles.stateText}>Não foi possível carregar as denúncias para calcular o score.</Text>
        ) : !denuncias ? (
          <ActivityIndicator color={AppColors.actionBlue} style={styles.loading} />
        ) : (
          <View style={styles.districtsList}>
            {score.distritos.map((distrito) => (
              <DistritoDetalhe key={distrito.rpa} distrito={distrito} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function NivelChip({ nivel, faixa }: { nivel: keyof typeof NIVEL_CORES; faixa: string }) {
  const cores = NIVEL_CORES[nivel];
  return (
    <View style={[styles.levelChip, { backgroundColor: cores.fundo }]}>
      <Text style={[styles.levelChipTitle, { color: cores.texto }]}>{cores.rotulo}</Text>
      <Text style={[styles.levelChipRange, { color: cores.texto }]}>{faixa}</Text>
    </View>
  );
}

function DistritoDetalhe({ distrito }: { distrito: DistritoScore }) {
  const cores = NIVEL_CORES[distrito.nivel];
  const parcelas = [
    { rotulo: 'Confirmadas', qtd: distrito.confirmadasRecentes, peso: PESOS.confirmadaRecente },
    { rotulo: 'Atrasadas', qtd: distrito.pendentesAtrasadas, peso: PESOS.pendenteAtrasada },
    { rotulo: 'Pendentes', qtd: distrito.pendentes, peso: PESOS.pendente },
  ];

  return (
    <View style={[styles.districtCard, { borderLeftColor: cores.cor }]}>
      <View style={styles.districtTop}>
        <Text style={styles.districtName}>
          {distrito.nome}
          <Text style={styles.districtZone}> ({distrito.zona})</Text>
        </Text>
        <View style={[styles.riskBadge, { backgroundColor: cores.fundo }]}>
          <Text style={[styles.riskBadgeText, { color: cores.texto }]}>
            {distrito.risco}% · {cores.rotulo}
          </Text>
        </View>
      </View>

      <View style={styles.breakdownRow}>
        {parcelas.map((parcela) => (
          <View key={parcela.rotulo} style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>{parcela.qtd}</Text>
            <Text style={styles.breakdownLabel}>
              {parcela.rotulo} ×{parcela.peso}
            </Text>
          </View>
        ))}
        <View style={[styles.breakdownItem, styles.breakdownTotal]}>
          <Text style={[styles.breakdownValue, { color: cores.texto }]}>{distrito.pontos}</Text>
          <Text style={styles.breakdownLabel}>Pontos</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.appBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.inactive,
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
    backgroundColor: '#EEF2FF',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.inactive,
    padding: 16,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.primaryText,
  },
  summaryCaption: {
    fontSize: 12,
    color: AppColors.secondaryText,
    marginTop: 2,
  },
  summaryValue: {
    fontSize: 30,
    fontWeight: '800',
  },
  summaryMax: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.secondaryText,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.primaryText,
    marginTop: 22,
    marginBottom: 10,
  },
  panel: {
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.inactive,
    padding: 16,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  weightText: {
    flex: 1,
  },
  weightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.primaryText,
  },
  weightDescription: {
    fontSize: 12,
    color: AppColors.secondaryText,
    marginTop: 2,
  },
  weightBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  weightBadgeZero: {
    backgroundColor: '#F1F5F9',
  },
  weightBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F46E5',
  },
  weightBadgeTextZero: {
    color: AppColors.secondaryText,
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 19,
    color: '#475569',
  },
  levelsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  levelChip: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  levelChipTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  levelChipRange: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  footnote: {
    fontSize: 12,
    color: AppColors.secondaryText,
    marginTop: 12,
  },
  loading: {
    marginTop: 16,
  },
  stateText: {
    fontSize: 13,
    color: AppColors.secondaryText,
    textAlign: 'center',
    paddingVertical: 12,
  },
  districtsList: {
    gap: 10,
  },
  districtCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.inactive,
    borderLeftWidth: 4,
    padding: 14,
  },
  districtTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  districtName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.primaryText,
  },
  districtZone: {
    fontSize: 12,
    fontWeight: '400',
    color: AppColors.secondaryText,
  },
  riskBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  breakdownRow: {
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownTotal: {
    borderLeftWidth: 1,
    borderLeftColor: AppColors.inactive,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.primaryText,
  },
  breakdownLabel: {
    fontSize: 10,
    color: AppColors.secondaryText,
    marginTop: 2,
  },
});
