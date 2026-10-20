import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, Fonts } from '@/constants/theme';
import { useAuth } from '@/src/contexts/auth-context';

interface NotificationItem {
  id: string;
  category: string;
  title: string;
  body: string;
  meta: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  accent: string;
  badge?: string;
  recommendation?: string;
}

const notificationPreview: NotificationItem[] = [
  {
    id: 'bairro-varzea',
    category: 'Alerta no seu bairro',
    title: 'Aumento de focos no bairro da Várzea',
    body: 'Identificado aumento de 15% nos relatos de água parada na RPA 4. Vistorie calhas, ralos e caixas d\'água residenciais para prevenir proliferação.',
    meta: 'Ontem às 16:15',
    icon: 'warning-amber',
    accent: '#8EA5FF',
    recommendation: 'Vistoria recomendada antes do fim de semana.',
  },
  {
    id: 'mutirao-recife',
    category: 'Secretaria de Saúde',
    title: 'Mutirão Recife Sem Dengue no próximo sábado',
    body: 'Equipes estarão orientando a comunidade e recolhendo potenciais criadouros nos bairros prioritários da zona oeste.',
    meta: '15 de Outubro',
    icon: 'campaign',
    accent: AppColors.securityBlue,
    badge: 'Participação comunitária aberta • RPA 4',
  },
];

export default function NotificationsScreen() {
  const { usuario, carregando } = useAuth();
  const router = useRouter();
  const [readIds, setReadIds] = useState<string[]>([]);

  if (carregando) {
    return (
      <SafeAreaView style={styles.loadingState}>
        <MaterialIcons name="notifications-none" size={30} color={AppColors.actionBlue} />
        <Text style={styles.loadingLabel}>Carregando notificações...</Text>
      </SafeAreaView>
    );
  }

  if (!usuario) {
    return <Redirect href="/login" />;
  }

  const unreadCount = notificationPreview.filter((item) => !readIds.includes(item.id)).length;

  function markAllAsRead() {
    setReadIds(notificationPreview.map((item) => item.id));
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Voltar para o perfil"
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
          <Text style={styles.headerTitle}>Notificações E Alertas</Text>
          <Text style={styles.city}>RECIFE</Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCopy}>
            <View style={[styles.summaryDot, unreadCount === 0 && styles.summaryDotRead]} />
            <Text style={styles.summaryLabel}>{unreadCount} notificações ativas</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={markAllAsRead}
            disabled={unreadCount === 0}>
            <Text style={[styles.markReadLabel, unreadCount === 0 && styles.disabledLabel]}>
              ✓ Marcar todas como lidas
            </Text>
          </Pressable>
        </View>

        <View style={styles.notificationList}>
          {notificationPreview.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              read={readIds.includes(item.id)}
              onRead={() => setReadIds((current) => [...new Set([...current, item.id])])}
            />
          ))}
        </View>

        <Pressable style={styles.settingsCard} accessibilityRole="button">
          <View style={styles.settingsIcon}>
            <MaterialIcons name="tune" size={21} color={AppColors.actionBlue} />
          </View>
          <View style={styles.settingsCopy}>
            <Text style={styles.settingsTitle}>Configurações de notificações</Text>
            <Text style={styles.settingsSubtitle}>Gerencie canais de push, SMS e alertas por bairro</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={AppColors.secondaryText} />
        </Pressable>

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
    </SafeAreaView>
  );
}

interface NotificationCardProps {
  item: NotificationItem;
  read: boolean;
  onRead: () => void;
}

function NotificationCard({ item, read, onRead }: NotificationCardProps) {
  return (
    <Pressable
      style={[styles.notificationCard, read && styles.readCard]}
      accessibilityRole="button"
      onPress={onRead}>
      <View style={[styles.cardAccent, { backgroundColor: item.accent }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardMetaRow}>
          <View style={styles.categoryBadge}>
            <MaterialIcons name={item.icon} size={14} color={AppColors.securityBlue} />
            <Text style={styles.categoryLabel}>{item.category}</Text>
          </View>
          <View style={styles.dateRow}>
            <MaterialIcons name="schedule" size={13} color={AppColors.secondaryText} />
            <Text style={styles.dateLabel}>{item.meta}</Text>
          </View>
        </View>

        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationBody}>{item.body}</Text>

        {item.recommendation ? (
          <View style={styles.recommendation}>
            <MaterialIcons name="water-drop" size={15} color={AppColors.actionBlue} />
            <Text style={styles.recommendationText}>{item.recommendation}</Text>
          </View>
        ) : null}

        {item.badge ? (
          <View style={styles.cardBadgeRow}>
            <MaterialIcons name="groups" size={14} color={AppColors.securityBlue} />
            <Text style={styles.cardBadgeText}>{item.badge}</Text>
          </View>
        ) : null}
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
    gap: 8,
    backgroundColor: '#F8F7FF',
  },
  loadingLabel: {
    color: AppColors.secondaryText,
    fontSize: 13,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 26,
  },
  header: {
    minHeight: 57,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E5F0',
    backgroundColor: '#FDFDFF',
  },
  logo: {
    width: 25,
    height: 32,
  },
  headerTitle: {
    flex: 1,
    color: AppColors.primaryText,
    fontFamily: Fonts?.sans,
    fontSize: 16,
    fontWeight: '700',
  },
  city: {
    color: AppColors.actionBlue,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  summaryRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
    backgroundColor: AppColors.securityBlue,
  },
  summaryDotRead: {
    backgroundColor: '#CBD5E1',
  },
  summaryLabel: {
    color: '#475569',
    fontSize: 11,
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
    borderRadius: 12,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  readCard: {
    opacity: 0.72,
  },
  cardAccent: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    gap: 7,
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
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: '#E7ECFF',
  },
  categoryLabel: {
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
    color: '#475569',
    fontSize: 10,
  },
  notificationTitle: {
    color: AppColors.primaryText,
    fontFamily: Fonts?.sans,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 21,
  },
  notificationBody: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E9EDFF',
  },
  recommendationText: {
    flex: 1,
    color: '#475569',
    fontSize: 11,
    lineHeight: 15,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  cardBadgeText: {
    color: '#475569',
    fontSize: 10,
  },
  settingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    marginHorizontal: 14,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
  },
  settingsIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 9,
    backgroundColor: '#E7ECFF',
  },
  settingsCopy: {
    flex: 1,
  },
  settingsTitle: {
    color: AppColors.primaryText,
    fontSize: 12,
    fontWeight: '700',
  },
  settingsSubtitle: {
    marginTop: 3,
    color: AppColors.secondaryText,
    fontSize: 10,
    lineHeight: 14,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 42,
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
});
