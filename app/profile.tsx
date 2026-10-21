import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppColors, Fonts } from '@/constants/theme';
import { useAuth } from '@/src/contexts/auth-context';
import { PrefeituraProfileView } from '@/src/features/profile/PrefeituraProfileView';

const profilePreview = {
  reports: '2 ATIVAS',
  reportSummary: '2 reportes em acompanhamento',
  notifiedSpots: '5',
  sanitaryIndex: 'Médio',
};

export default function ProfileScreen() {
  const { usuario, carregando } = useAuth();
  const router = useRouter();

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
            <MaterialIcons name="verified-user" size={13} color={AppColors.securityBlue} />
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
              <MaterialIcons name="person-outline" size={13} color={AppColors.actionBlue} />{' '}
              {roleLabel} • {usuario.email || 'Perfil ativo'}
            </Text>
            <View style={styles.levelBadge}>
              <MaterialIcons name="public" size={11} color={AppColors.securityBlue} />
              <Text style={styles.levelLabel}>
                {usuario.numero_matricula || usuario.cpf || 'Cadastro ativo'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.reportCard}>
          <View style={styles.cardIconBlue}>
            <MaterialIcons name="assignment" size={21} color={AppColors.actionBlue} />
          </View>
          <View style={styles.reportCopy}>
            <View style={styles.reportTitleRow}>
              <Text style={styles.reportTitle}>Minhas denúncias</Text>
              <Text style={styles.reportCount}>{profilePreview.reports}</Text>
            </View>
            <Text style={styles.reportSubtitle}>{profilePreview.reportSummary} • Toque para ver</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={AppColors.secondaryText} />
        </View>

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
          />
          <ActionRow
            icon="logout"
            title="Encerrar Sessão"
            subtitle="Desconectar conta com segurança deste dispositivo"
            destructive
          />
        </View>

        <View style={styles.footer}>
          <View style={styles.footerBrandRow}>
            <MaterialIcons name="local-hospital" size={13} color={AppColors.actionBlue} />
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
        <MaterialIcons name={icon} size={16} color={icon === 'warning-amber' ? AppColors.attention : AppColors.actionBlue} />
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
  onPress?: () => void;
}

function ActionRow({ icon, title, subtitle, badge, destructive = false, onPress }: ActionRowProps) {
  const color = destructive ? AppColors.highRisk : AppColors.actionBlue;

  return (
    <Pressable style={styles.actionRow} accessibilityRole="button" onPress={onPress}>
      <View style={[styles.actionIcon, destructive && styles.destructiveIcon]}>
        <MaterialIcons name={icon} size={19} color={color} />
      </View>
      <View style={styles.actionCopy}>
        <View style={styles.actionTitleRow}>
          <Text style={[styles.actionTitle, destructive && styles.destructiveText]}>{title}</Text>
          {badge ? <Text style={styles.newBadge}>{badge}</Text> : null}
        </View>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={21} color={destructive ? AppColors.highRisk : AppColors.secondaryText} />
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 34,
    gap: 12,
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  logo: {
    width: 32,
    height: 40,
    marginRight: 6,
  },
  brandBlock: {
    flex: 1,
  },
  brandName: {
    color: AppColors.primaryText,
    fontFamily: Fonts?.sans,
    fontSize: 17,
    fontWeight: '700',
  },
  city: {
    color: AppColors.actionBlue,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
  },
  activeLabel: {
    color: AppColors.securityBlue,
    fontSize: 10,
    fontWeight: '600',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 92,
    padding: 12,
    borderRadius: 13,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatar: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    borderRadius: 29,
    borderWidth: 3,
    borderColor: '#BFDBFE',
    backgroundColor: '#DBEAFE',
  },
  avatarLabel: {
    color: AppColors.securityBlue,
    fontSize: 17,
    fontWeight: '800',
  },
  userCopy: {
    flex: 1,
    gap: 4,
  },
  greeting: {
    color: AppColors.primaryText,
    fontFamily: Fonts?.sans,
    fontSize: 17,
    fontWeight: '700',
  },
  userMeta: {
    color: AppColors.secondaryText,
    fontSize: 11,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#EEF2FF',
  },
  levelLabel: {
    color: AppColors.securityBlue,
    fontSize: 9,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70,
    padding: 12,
    borderRadius: 13,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardIconBlue: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 10,
    backgroundColor: '#E0E7FF',
  },
  reportCopy: {
    flex: 1,
  },
  reportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  reportTitle: {
    color: AppColors.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  reportCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    color: AppColors.securityBlue,
    fontSize: 8,
    fontWeight: '800',
  },
  reportSubtitle: {
    marginTop: 3,
    color: AppColors.secondaryText,
    fontSize: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    minHeight: 70,
    padding: 10,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    flex: 1,
    color: '#475569',
    fontSize: 10,
  },
  metricValue: {
    marginTop: 6,
    fontSize: 19,
    fontWeight: '700',
  },
  actionList: {
    overflow: 'hidden',
    borderRadius: 13,
    backgroundColor: AppColors.surface,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 63,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  actionIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 9,
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
    gap: 6,
  },
  actionTitle: {
    color: AppColors.primaryText,
    fontSize: 12,
    fontWeight: '700',
  },
  destructiveText: {
    color: AppColors.highRisk,
  },
  actionSubtitle: {
    marginTop: 3,
    color: AppColors.secondaryText,
    fontSize: 9,
  },
  newBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 7,
    backgroundColor: '#B91C1C',
    color: AppColors.surface,
    fontSize: 8,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 18,
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
    marginTop: 5,
    color: '#94A3B8',
    fontSize: 9,
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
    fontSize: 10,
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
