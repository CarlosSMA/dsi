import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import type { Denuncia, StatusDenuncia } from '@/src/types';

const STATUS_CONFIG: Record<
  StatusDenuncia,
  { label: string; color: string; backgroundColor: string }
> = {
  pendente: {
    label: 'Pendente',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
  },
  em_analise: {
    label: 'Em análise',
    color: '#1D4ED8',
    backgroundColor: '#DBEAFE',
  },
  confirmada: {
    label: 'Confirmada',
    color: '#047857',
    backgroundColor: '#D1FAE5',
  },
  descartada: {
    label: 'Descartada',
    color: '#475569',
    backgroundColor: '#E2E8F0',
  },
};

function formatarData(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(data);
}

function DenunciaCard({ denuncia }: { denuncia: Denuncia }) {
  const status = STATUS_CONFIG[denuncia.statusDenuncia];

  return (
    <View style={styles.denunciaCard}>
      {denuncia.urlFoto ? (
        <Image source={{ uri: denuncia.urlFoto }} style={styles.denunciaImage} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <MaterialIcons name="image-not-supported" size={28} color="#94A3B8" />
        </View>
      )}

      <View style={styles.denunciaContent}>
        <View style={styles.denunciaHeader}>
          <Text style={styles.denunciaNeighborhood} numberOfLines={1}>
            {denuncia.bairro}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.backgroundColor }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="event" size={16} color={AppColors.secondaryText} />
          <Text style={styles.detailText}>{formatarData(denuncia.dataCriacao)}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="location-on" size={16} color={AppColors.secondaryText} />
          <Text style={styles.detailText}>Localização registrada</Text>
        </View>
      </View>
    </View>
  );
}

export default function DenunciasRoute() {
  const router = useRouter();
  const { usuario, carregando: carregandoUsuario } = useAuth();
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarDenuncias = useCallback(async (refresh = false) => {
    if (refresh) {
      setAtualizando(true);
    } else {
      setCarregando(true);
    }

    setErro(null);

    try {
      setDenuncias(await listarDenuncias());
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar as denúncias. Tente novamente.'
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    if (usuario?.role !== 'agente') {
      return;
    }

    const timeoutId = setTimeout(() => {
      carregarDenuncias();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [carregarDenuncias, usuario?.role]);

  if (carregandoUsuario) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={AppColors.actionBlue} />
        <Text style={styles.stateText}>Carregando denúncias...</Text>
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
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Voltar para o painel da prefeitura"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={AppColors.primaryText} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Denúncias</Text>
          <Text style={styles.subtitle}>
            {denuncias.length} {denuncias.length === 1 ? 'ocorrência encontrada' : 'ocorrências encontradas'}
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <MaterialIcons name="assignment" size={22} color={AppColors.actionBlue} />
        </View>
      </View>

      {carregando ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={AppColors.actionBlue} />
          <Text style={styles.stateText}>Carregando denúncias...</Text>
        </View>
      ) : erro ? (
        <View style={styles.centeredContainer}>
          <MaterialIcons name="error-outline" size={42} color={AppColors.highRisk} />
          <Text style={styles.stateTitle}>Não foi possível carregar</Text>
          <Text style={styles.stateText}>{erro}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => carregarDenuncias()}
            style={styles.retryButton}>
            <MaterialIcons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : denuncias.length === 0 ? (
        <View style={styles.centeredContainer}>
          <MaterialIcons name="assignment-late" size={48} color="#94A3B8" />
          <Text style={styles.stateTitle}>Nenhuma denúncia registrada</Text>
          <Text style={styles.stateText}>
            As denúncias enviadas pelos cidadãos aparecerão aqui.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={() => carregarDenuncias(true)}
              colors={[AppColors.actionBlue]}
              tintColor={AppColors.actionBlue}
            />
          }
          showsVerticalScrollIndicator={false}>
          {denuncias.map((denuncia) => (
            <DenunciaCard denuncia={denuncia} key={denuncia.id} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    marginRight: 10,
    width: 40,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    color: AppColors.primaryText,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: AppColors.secondaryText,
    fontSize: 12,
    marginTop: 2,
  },
  headerIcon: {
    alignItems: 'center',
    backgroundColor: '#E0EDFF',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  listContent: {
    gap: 12,
    padding: 16,
  },
  denunciaCard: {
    backgroundColor: AppColors.surface,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    padding: 12,
  },
  denunciaImage: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    height: 92,
    marginRight: 12,
    width: 92,
  },
  imagePlaceholder: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    height: 92,
    justifyContent: 'center',
    marginRight: 12,
    width: 92,
  },
  denunciaContent: {
    flex: 1,
    justifyContent: 'center',
  },
  denunciaHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  denunciaNeighborhood: {
    color: AppColors.primaryText,
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    marginRight: 8,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 5,
  },
  detailText: {
    color: AppColors.secondaryText,
    fontSize: 12,
    marginLeft: 6,
  },
  centeredContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  stateTitle: {
    color: AppColors.primaryText,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  stateText: {
    color: AppColors.secondaryText,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: AppColors.actionBlue,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 6,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
