import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { DenunciaListItem } from '@/src/features/denuncias/DenunciaListItem';
import { listarDenuncias } from '@/src/services/denuncias-consulta-service';
import type { Denuncia } from '@/src/types';

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
      {/* A tela tem cabeçalho próprio com o botão de voltar: esconde o cabeçalho padrão da navegação. */}
      <Stack.Screen options={{ headerShown: false }} />
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
            <DenunciaListItem denuncia={denuncia} key={denuncia.id} />
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
