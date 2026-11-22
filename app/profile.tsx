import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { type Href, Redirect, Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { AppColors, Fonts } from '@/constants/theme';
import { useAuth } from '@/src/contexts/auth-context';
import { PrefeituraProfileView } from '@/src/features/profile/PrefeituraProfileView';
import { Denuncias } from '@/src/models/Denuncia';

const profilePreview = {
  notifiedSpots: '5',
  sanitaryIndex: 'Médio',
};

interface DenunciaResumo {
  total: number;
  ativas: number;
}

export default function ProfileScreen() {
  const { usuario, carregando, logout } = useAuth();
  const router = useRouter();
  const [resumoDenuncias, setResumoDenuncias] = useState<DenunciaResumo>({
    total: 0,
    ativas: 0,
  });
  const [carregandoResumo, setCarregandoResumo] = useState(true);
  const [erroResumo, setErroResumo] = useState(false);

  const carregarResumoDenuncias = useCallback(async () => {
    if (!usuario || usuario.role !== 'cidadao') {
      return;
    }

    setCarregandoResumo(true);
    setErroResumo(false);

    try {
      const denuncias = await Denuncias.listarMinhas(usuario.id);
      const ativas = denuncias.filter(
        ({ statusDenuncia }) => statusDenuncia === 'pendente'
      ).length;

      setResumoDenuncias({
        total: denuncias.length,
        ativas,
      });
    } catch (error) {
      console.error('Não foi possível carregar o resumo das denúncias:', error);
      setErroResumo(true);
    } finally {
      setCarregandoResumo(false);
    }
  }, [usuario]);

  useEffect(() => {
    if (!usuario || usuario.role !== 'cidadao') {
      return;
    }

    const timeoutId = setTimeout(() => {
      carregarResumoDenuncias();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [carregarResumoDenuncias, usuario]);

  if (carregando) {
    return (
      <SafeAreaView style={styles.loadingState}>
        <MaterialIcons name="person" size={30} color={AppColors.actionBlue} />
        <Text style={styles.loadingLabel}>Carregando perfil...</Text>
      </SafeAreaView>
    );
  }

  if (!usuario) {
    return <Redirect href="/login" />;
  }

  // Redireciona automaticamente para o Painel da Prefeitura se o usuário for Agente Municipal
  if (usuario.role === 'agente') {
    return <PrefeituraProfileView usuario={usuario} />;
  }

  const roleLabel = 'Cidadão';
  const initials = getInitials(usuario.nome);

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/vetor-risco-logo.png')}
            contentFit="contain"
            style={styles.logo}
          />
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>VetorRisco</Text>
            <Text style={styles.city}>RECIFE</Text>
          </View>
          <View style={styles.activeBadge}>
            <MaterialIcons name="verified-user" size={15} color={AppColors.securityBlue} />
            <Text style={styles.activeLabel}>Ativo</Text>
          </View>
        </View>

        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>{initials}</Text>
          </View>
          <View style={styles.userCopy}>
            <Text style={styles.greeting}>Olá, {usuario.nome}!</Text>
            <Text style={styles.userMeta}>
              <MaterialIcons name="person-outline" size={15} color={AppColors.actionBlue} />{' '}
              {roleLabel} • {usuario.email || 'Perfil ativo'}
            </Text>
            <View style={styles.levelBadge}>
              <MaterialIcons name="public" size={13} color={AppColors.securityBlue} />
              <Text style={styles.levelLabel}>
                {usuario.numero_matricula || usuario.cpf || 'Cadastro ativo'}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          accessibilityLabel="Abrir minhas denúncias"
          accessibilityRole="button"
          onPress={() => router.push('/minhas-denuncias' as Href)}
          style={({ pressed }) => [styles.reportCard, pressed && styles.reportCardPressed]}>
          <View style={styles.cardIconBlue}>
            <MaterialIcons name="assignment" size={24} color={AppColors.actionBlue} />
          </View>
          <View style={styles.reportCopy}>
            <View style={styles.reportTitleRow}>
              <Text style={styles.reportTitle}>Minhas denúncias</Text>
              <Text style={styles.reportCount}>
                {carregandoResumo ? '...' : erroResumo ? '-' : resumoDenuncias.total}
              </Text>
            </View>
            <Text style={styles.reportSubtitle}>
              {erroResumo
                ? 'Não foi possível carregar o resumo'
                : carregandoResumo
                  ? 'Carregando suas ocorrências...'
                  : resumoDenuncias.ativas === 0
                    ? 'Nenhuma ocorrência em acompanhamento'
                    : `${resumoDenuncias.ativas} ${
                        resumoDenuncias.ativas === 1
                          ? 'ocorrência em acompanhamento'
                          : 'ocorrências em acompanhamento'
                      }`}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={AppColors.secondaryText} />
        </Pressable>

        <View style={styles.metricsRow}>
          <MetricCard
            label="Focos Notificados"
            value={profilePreview.notifiedSpots}
            icon="radar"
            valueColor={AppColors.primaryText}
          />
          <MetricCard
            label="Índice Sanitário"
            value={profilePreview.sanitaryIndex}
            icon="warning-amber"
            valueColor="#B45309"
          />
        </View>

        <View style={styles.actionList}>
          <ActionRow
            icon="notifications-none"
            title="Notificações e Alertas"
            subtitle="Respostas da Vigilância Ambiental e avisos"
            badge="1 nova"
            onPress={() => router.push('/notifications')}
          />
          <ActionRow
            icon="badge"
            title="Meus Dados Cadastrais"
            subtitle="Informações pessoais, bairro e contato"
            onPress={() => router.push('/meus-dados')}
          />
          <ActionRow
            icon="logout"
            title="Encerrar Sessão"
            subtitle="Desconectar conta com segurança deste dispositivo"
            destructive
            last
            onPress={handleLogout}
          />
        </View>

        <View style={styles.footer}>
          <View style={styles.footerBrandRow}>
            <MaterialIcons name="local-hospital" size={15} color={AppColors.actionBlue} />
            <Text style={styles.footerStrong}>SUS</Text>
            <Text style={styles.footerDot}>•</Text>
            <Text style={styles.footerText}>Prefeitura do Recife</Text>
          </View>
          <Text style={styles.footerCaption}>Iniciativa de apoio à Saúde Pública de Recife</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <BottomNavItem icon="home" label="Início" onPress={() => router.replace('/map')} />
        <Pressable
          style={styles.reportNavItem}
          accessibilityRole="button"
          accessibilityLabel="Abrir denúncia"
          onPress={() => router.push('/photo-report')}>
          <View style={styles.reportNavButton}>
            <MaterialIcons name="photo-camera" size={23} color={AppColors.surface} />
          </View>
          <Text style={styles.navLabel}>Denunciar</Text>
        </Pressable>
        <BottomNavItem icon="person-outline" label="Perfil" selected onPress={() => router.replace('/profile')} />
      </View>
    </SafeAreaView>
  );
}

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return initials || 'U';
}

interface BottomNavItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

function BottomNavItem({ icon, label, selected = false, onPress }: BottomNavItemProps) {
  return (
    <Pressable style={styles.navItem} accessibilityRole="button" onPress={onPress}>
      <MaterialIcons
        name={icon}
        size={22}
        color={selected ? AppColors.actionBlue : AppColors.secondaryText}
      />
      <Text style={[styles.navLabel, selected && styles.navLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  valueColor: string;
}

function MetricCard({ label, value, icon, valueColor }: MetricCardProps) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{label}</Text>
        <MaterialIcons name={icon} size={20} color={icon === 'warning-amber' ? AppColors.attention : AppColors.actionBlue} />
      </View>
      <Text style={[styles.metricValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

interface ActionRowProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  badge?: string;
  destructive?: boolean;
  // Último item do card: sem a linha divisória embaixo.
  last?: boolean;
  onPress?: () => void;
}

function ActionRow({ icon, title, subtitle, badge, destructive = false, last = false, onPress }: ActionRowProps) {
  const color = destructive ? AppColors.highRisk : AppColors.actionBlue;

  return (
    <Pressable
      style={({ pressed }) => [styles.actionRow, last && styles.actionRowLast, pressed && styles.actionRowPressed]}
      accessibilityRole="button"
      onPress={onPress}>
      <View style={[styles.actionIcon, destructive && styles.destructiveIcon]}>
        <MaterialIcons name={icon} size={22} color={color} />
      </View>
      <View style={styles.actionCopy}>
        <View style={styles.actionTitleRow}>
          <Text style={[styles.actionTitle, destructive && styles.destructiveText]}>{title}</Text>
          {badge ? <Text style={styles.newBadge}>{badge}</Text> : null}
        </View>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={destructive ? AppColors.highRisk : AppColors.secondaryText} />
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
    gap: 8,
    backgroundColor: '#F8F7FF',
  },
  loadingLabel: {
    color: AppColors.secondaryText,
    fontSize: 13,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 16,
  },
  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  logo: {
    width: 38,
    height: 48,
    marginRight: 8,
  },
  brandBlock: {
    flex: 1,
  },
  brandName: {
    color: AppColors.primaryText,
    fontFamily: Fonts?.sans,
    fontSize: 21,
    fontWeight: '700',
  },
  city: {
    color: AppColors.actionBlue,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
  },
  activeLabel: {
    color: AppColors.securityBlue,
    fontSize: 13,
    fontWeight: '600',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 120,
    padding: 18,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: '#BFDBFE',
    backgroundColor: '#DBEAFE',
  },
  avatarLabel: {
    color: AppColors.securityBlue,
    fontSize: 24,
    fontWeight: '800',
  },
  userCopy: {
    flex: 1,
    gap: 6,
  },
  greeting: {
    color: AppColors.primaryText,
    fontFamily: Fonts?.sans,
    fontSize: 21,
    fontWeight: '700',
  },
  userMeta: {
    color: AppColors.secondaryText,
    fontSize: 13,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
  },
  levelLabel: {
    color: AppColors.securityBlue,
    fontSize: 12,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 88,
    padding: 18,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  reportCardPressed: {
    backgroundColor: '#F1F5F9',
  },
  cardIconBlue: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderRadius: 12,
    backgroundColor: '#E0E7FF',
  },
  reportCopy: {
    flex: 1,
  },
  reportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportTitle: {
    color: AppColors.primaryText,
    fontSize: 17,
    fontWeight: '700',
  },
  reportCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: '#DBEAFE',
    color: AppColors.securityBlue,
    fontSize: 12,
    fontWeight: '800',
  },
  reportSubtitle: {
    marginTop: 4,
    color: AppColors.secondaryText,
    fontSize: 13,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minHeight: 104,
    padding: 16,
    borderRadius: 18,
    justifyContent: 'space-between',
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    flex: 1,
    color: '#475569',
    fontSize: 13,
  },
  metricValue: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: '800',
  },
  actionList: {
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 68,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionRowPressed: {
    backgroundColor: '#F1F5F9',
  },
  actionIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
  },
  destructiveIcon: {
    backgroundColor: '#FEF2F2',
  },
  actionCopy: {
    flex: 1,
  },
  actionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionTitle: {
    color: AppColors.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  destructiveText: {
    color: AppColors.highRisk,
  },
  actionSubtitle: {
    marginTop: 4,
    color: AppColors.secondaryText,
    fontSize: 13,
  },
  newBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#B91C1C',
    color: AppColors.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 24,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerStrong: {
    color: AppColors.primaryText,
    fontSize: 13,
    fontWeight: '700',
  },
  footerDot: {
    color: AppColors.secondaryText,
    fontSize: 13,
  },
  footerText: {
    color: AppColors.secondaryText,
    fontSize: 13,
  },
  footerCaption: {
    marginTop: 5,
    color: '#94A3B8',
    fontSize: 12,
  },
  bottomNav: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 22,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: AppColors.surface,
  },
  navItem: {
    width: 74,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    paddingBottom: 4,
  },
  navLabel: {
    color: AppColors.secondaryText,
    fontSize: 12,
  },
  navLabelSelected: {
    color: AppColors.actionBlue,
    fontWeight: '700',
  },
  reportNavItem: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -29,
  },
  reportNavButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: AppColors.actionBlue,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
});
