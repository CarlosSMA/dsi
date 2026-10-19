import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Image } from 'expo-image';

import { AppColors, Fonts } from '@/constants/theme';
import { Gps } from '@/src/lib/gps';
import { useAuth } from '@/src/contexts/auth-context';
import { registrarDenuncia } from '@/src/services/denuncia-service';
import { removeReportPhoto, uploadReportPhoto } from '@/src/services/photo-service';
import { takePhoto } from '@/components/camera';

export default function PhotoReportScreen() {
  const router = useRouter();
  const { usuario, carregando } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  if (carregando) {
    return <LoadingState />;
  }

  if (!usuario) {
    return <Redirect href="/login" />;
  }

  const currentUser = usuario;

  async function handleTakePhoto() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setPreviewUri(null);

    try {
      const location = await Gps.getCurrentLocation();
      if (!location) {
        return;
      }

      const result = await takePhoto(ImagePicker.CameraType.back, 0.7);
      if (!result || result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      setPreviewUri(asset.uri);
      const bairro = await getNeighborhood(location.latitude, location.longitude);
      const reportId = `${currentUser.id}-${Date.now()}`;
      const uploadedPhoto = await uploadReportPhoto({
        uri: asset.uri,
        userId: currentUser.id,
        reportId,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });

      try {
        await registrarDenuncia({
          id: reportId,
          id_denunciador: currentUser.id,
          latitude: location.latitude,
          longitude: location.longitude,
          bairro,
          urlFoto: uploadedPhoto.url,
        });
      } catch (error) {
        await removeReportPhoto(uploadedPhoto.path);
        throw error;
      }

      Alert.alert('Ocorrência registrada', 'Sua foto foi enviada para análise.');
    } catch (error) {
      console.error('Erro ao registrar ocorrência com foto:', error);
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: 'Nova ocorrência', headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={26} color={AppColors.primaryText} />
          </Pressable>
          <View>
            <Text style={styles.brand}>VetorRisco</Text>
            <Text style={styles.city}>RECIFE</Text>
          </View>
          <MaterialIcons name="help-outline" size={22} color={AppColors.secondaryText} />
        </View>

        <View style={styles.introCard}>
          <View style={styles.cameraIcon}>
            <MaterialIcons name="photo-camera" size={26} color={AppColors.surface} />
          </View>
          <View style={styles.introText}>
            <Text style={styles.eyebrow}>ETAPA PRÉVIA • CÂMERA</Text>
            <Text style={styles.title}>Antes de fazer sua denúncia</Text>
          </View>
        </View>

        <Text style={styles.description}>
          Para registrar uma ocorrência com rapidez e eficácia no combate aos vetores, siga estas
          orientações:
        </Text>

        <Instruction icon="check-circle-outline" title="Identifique o foco" text="Localize o possível criadouro ou situação de risco." />
        <Instruction icon="check-circle-outline" title="Tire uma foto nítida" text="Procure registrar o local com boa visibilidade." />
        <Instruction icon="check-circle-outline" title="Confirme sua localização" text="Verifique se o ponto indicado no mapa está correto." />

        {previewUri ? <Image source={{ uri: previewUri }} style={styles.preview} contentFit="cover" /> : null}

        <View style={styles.warning}>
          <MaterialIcons name="warning-amber" size={22} color={AppColors.attention} />
          <View style={styles.warningText}>
            <Text style={styles.warningTitle}>Atenção à sua segurança</Text>
            <Text style={styles.warningBody}>Não se coloque em risco para registrar uma ocorrência.</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tirar foto e registrar ocorrência"
          disabled={isSubmitting}
          style={[styles.submitButton, isSubmitting && styles.disabledButton]}
          onPress={handleTakePhoto}>
          {isSubmitting ? (
            <ActivityIndicator color={AppColors.surface} />
          ) : (
            <>
              <MaterialIcons name="photo-camera" size={22} color={AppColors.surface} />
              <Text style={styles.submitLabel}>TIRAR DEPOIS</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Instruction({ icon, title, text }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; text: string }) {
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

async function getNeighborhood(latitude: number, longitude: number): Promise<string> {
  const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
  const address = addresses[0];
  const neighborhood = address?.district || address?.subregion || address?.city;

  if (!neighborhood || neighborhood.trim().length < 2) {
    throw new Error('Não foi possível identificar o bairro pela localização.');
  }

  return neighborhood;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Não foi possível registrar a ocorrência. Tente novamente.';
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.appBackground },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 14 },
  header: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { color: AppColors.primaryText, fontFamily: Fonts?.sans, fontSize: 18, fontWeight: '700' },
  city: { color: AppColors.actionBlue, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9E7FF',
    backgroundColor: '#F7FAFF',
  },
  cameraIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.actionBlue,
  },
  introText: { flex: 1, gap: 4 },
  eyebrow: { color: AppColors.actionBlue, fontSize: 11, fontWeight: '700' },
  title: { color: AppColors.primaryText, fontSize: 20, fontWeight: '700' },
  description: { color: AppColors.secondaryText, fontSize: 14, lineHeight: 21 },
  instruction: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: AppColors.surface,
  },
  instructionText: { flex: 1, gap: 4 },
  instructionTitle: { color: AppColors.primaryText, fontSize: 15, fontWeight: '700' },
  instructionBody: { color: AppColors.secondaryText, fontSize: 13, lineHeight: 19 },
  preview: { width: '100%', height: 180, borderRadius: 14 },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
  },
  warningText: { flex: 1, gap: 3 },
  warningTitle: { color: '#92400E', fontSize: 14, fontWeight: '700' },
  warningBody: { color: '#B45309', fontSize: 13, lineHeight: 18 },
  submitButton: {
    minHeight: 58,
    marginTop: 4,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    backgroundColor: AppColors.actionBlue,
  },
  disabledButton: { opacity: 0.7 },
  submitLabel: { color: AppColors.surface, fontSize: 16, fontWeight: '700' },
});
