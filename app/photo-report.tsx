import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { AppColors, Fonts } from '@/constants/theme';
import { useAuth } from '@/src/contexts/auth-context';
import { useRegistrarOcorrencia } from '@/src/features/report/useRegistrarOcorrencia';
import {
  getPreference,
  ocultarInstrucoesFotoKey,
  removePreference,
  setPreference,
} from '@/src/lib/preferences';

export default function PhotoReportScreen() {
  const router = useRouter();
  const { usuario, carregando } = useAuth();
  const {
    isSubmitting,
    fotos,
    maxFotos,
    capturarFoto,
    selecionarDaGaleria,
    removerFoto,
    enviarOcorrencia,
  } = useRegistrarOcorrencia(usuario);

  const [ocultarInstrucoes, setOcultarInstrucoes] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    getPreference(ocultarInstrucoesFotoKey(usuario.id))
      .then((valor) => setOcultarInstrucoes(valor === 'true'))
      .catch(() => setOcultarInstrucoes(false));
  }, [usuario]);

  if (carregando) {
    return <LoadingState />;
  }

  if (!usuario) {
    return <Redirect href="/login" />;
  }

  const userId = usuario.id;

  function alternarOcultarInstrucoes() {
    const novoValor = !ocultarInstrucoes;
    setOcultarInstrucoes(novoValor);
    const chave = ocultarInstrucoesFotoKey(userId);
    (novoValor ? setPreference(chave, 'true') : removePreference(chave)).catch((error) =>
      console.error('Erro ao salvar preferência das instruções:', error)
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: 'Nova ocorrência', headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={8}
            onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={26} color={AppColors.primaryText} />
          </Pressable>
          <View>
            <Text style={styles.brand}>VetorRisco</Text>
            <Text style={styles.city}>RECIFE</Text>
          </View>
          <MaterialIcons name="help-outline" size={22} color={AppColors.secondaryText} />
        </View>

        {/* Card de Boas-vindas/Instrução */}
        <View style={styles.introCard}>
          <View style={styles.cameraIcon}>
            <MaterialIcons name="photo-camera" size={26} color={AppColors.surface} />
          </View>
          <View style={styles.introText}>
            <Text style={styles.eyebrow}>REGISTRO DE FOCOS • ATÉ 4 FOTOS</Text>
            <Text style={styles.title}>Evidências da denúncia</Text>
          </View>
        </View>

        <Text style={styles.description}>
          Anexe uma ou mais fotos nítidas do foco (ex: visão geral, close do criadouro e ponto de referência)
          para auxiliar os agentes da Vigilância Ambiental:
        </Text>

        <Instruction
          icon="check-circle-outline"
          title="Identifique o criadouro"
          text="Caixas d'água destampadas, pneus, calhas obstruídas ou poças."
        />
        <Instruction
          icon="collections"
          title="Múltiplos ângulos"
          text="Você pode anexar até 4 fotos com detalhes de perto e de longe."
        />
        <Instruction
          icon="my-location"
          title="Localização automática"
          text="O GPS do aparelho registra o ponto exato da ocorrência no Recife."
        />

        {/* Galeria de Pré-visualização das Fotos Anexadas */}
        {fotos.length > 0 ? (
          <View style={styles.galleryContainer}>
            <View style={styles.galleryHeader}>
              <Text style={styles.galleryTitle}>Fotos anexadas</Text>
              <Text style={styles.galleryCount}>
                {fotos.length} de {maxFotos} fotos
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailsScroll}>
              {fotos.map((item, index) => (
                <View key={item.uri} style={styles.thumbnailCard}>
                  <Image source={{ uri: item.uri }} style={styles.thumbnailImage} contentFit="cover" />
                  <Pressable
                    style={styles.removePhotoButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover foto ${index + 1}`}
                    onPress={() => removerFoto(index)}>
                    <MaterialIcons name="close" size={16} color="#FFFFFF" />
                  </Pressable>
                  <View style={styles.photoNumberBadge}>
                    <Text style={styles.photoNumberText}>{index + 1}</Text>
                  </View>
                </View>
              ))}

              {fotos.length < maxFotos ? (
                <View style={styles.addMoreContainer}>
                  <Pressable
                    style={styles.addMoreButton}
                    accessibilityRole="button"
                    onPress={capturarFoto}>
                    <MaterialIcons name="add-a-photo" size={22} color={AppColors.actionBlue} />
                    <Text style={styles.addMoreText}>Câmera</Text>
                  </Pressable>
                  <Pressable
                    style={styles.addMoreButton}
                    accessibilityRole="button"
                    onPress={selecionarDaGaleria}>
                    <MaterialIcons name="photo-library" size={22} color={AppColors.actionBlue} />
                    <Text style={styles.addMoreText}>Galeria</Text>
                  </Pressable>
                </View>
              ) : null}
            </ScrollView>
          </View>
        ) : null}

        {/* Alerta de Segurança */}
        <View style={styles.warning}>
          <MaterialIcons name="warning-amber" size={22} color={AppColors.attention} />
          <View style={styles.warningText}>
            <Text style={styles.warningTitle}>Atenção à sua segurança</Text>
            <Text style={styles.warningBody}>Não se coloque em risco para registrar uma ocorrência.</Text>
          </View>
        </View>

        {/* Preferência de Instruções */}
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: ocultarInstrucoes }}
          hitSlop={6}
          onPress={alternarOcultarInstrucoes}
          style={styles.checkboxRow}>
          <MaterialIcons
            name={ocultarInstrucoes ? 'check-box' : 'check-box-outline-blank'}
            size={22}
            color={ocultarInstrucoes ? AppColors.actionBlue : AppColors.secondaryText}
          />
          <Text style={styles.checkboxLabel}>Não mostrar estas instruções novamente</Text>
        </Pressable>

        {/* Botões de Ação */}
        {fotos.length === 0 ? (
          <View style={styles.actionButtonsContainer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tirar foto com a câmera"
              disabled={isSubmitting}
              style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
              onPress={capturarFoto}>
              <MaterialIcons name="photo-camera" size={22} color={AppColors.surface} />
              <Text style={styles.primaryButtonText}>TIRAR FOTO</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Selecionar fotos da galeria"
              disabled={isSubmitting}
              style={[styles.secondaryButton, isSubmitting && styles.disabledButton]}
              onPress={selecionarDaGaleria}>
              <MaterialIcons name="photo-library" size={20} color={AppColors.actionBlue} />
              <Text style={styles.secondaryButtonText}>ESCOLHER DA GALERIA</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar denúncia com fotos anexadas"
            disabled={isSubmitting}
            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
            onPress={() => enviarOcorrencia(() => router.back())}>
            {isSubmitting ? (
              <ActivityIndicator color={AppColors.surface} />
            ) : (
              <>
                <MaterialIcons name="cloud-upload" size={22} color={AppColors.surface} />
                <Text style={styles.submitLabel}>
                  ENVIAR DENÚNCIA ({fotos.length} {fotos.length === 1 ? 'FOTO' : 'FOTOS'})
                </Text>
              </>
            )}
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Instruction({
  icon,
  title,
  text,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.instruction}>
      <MaterialIcons name={icon} size={24} color={AppColors.safe} />
      <View style={styles.instructionText}>
        <Text style={styles.instructionTitle}>{title}</Text>
        <Text style={styles.instructionBody}>{text}</Text>
      </View>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={AppColors.actionBlue} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.appBackground },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 14, paddingBottom: 36 },
  header: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontFamily: Fonts?.sans,
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.primaryText,
    textAlign: 'center',
  },
  city: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.actionBlue,
    letterSpacing: 1,
    textAlign: 'center',
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cameraIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: AppColors.actionBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: { flex: 1 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.actionBlue,
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.primaryText,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: AppColors.secondaryText,
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  instructionText: { flex: 1 },
  instructionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.primaryText,
  },
  instructionBody: {
    fontSize: 12,
    color: AppColors.secondaryText,
    marginTop: 2,
  },
  galleryContainer: {
    marginTop: 4,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  galleryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.primaryText,
  },
  galleryCount: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.actionBlue,
  },
  thumbnailsScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  thumbnailCard: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoNumberBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  addMoreContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  addMoreButton: {
    width: 76,
    height: 100,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addMoreText: {
    fontSize: 10,
    fontWeight: '600',
    color: AppColors.actionBlue,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningText: { flex: 1 },
  warningTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  warningBody: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkboxLabel: {
    fontSize: 12,
    color: AppColors.secondaryText,
  },
  actionButtonsContainer: {
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 12,
    backgroundColor: AppColors.actionBlue,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.surface,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.actionBlue,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#059669',
  },
  submitLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.surface,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
