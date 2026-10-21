import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useState } from 'react';
import { Alert } from 'react-native';

import { takePhoto } from '@/components/camera';
import { Gps } from '@/src/lib/gps';
import { registrarDenuncia } from '@/src/services/denuncia-service';
import { removeReportPhoto, uploadReportPhoto } from '@/src/services/photo-service';
import type { Usuario } from '@/src/types';

// Fluxo de registrar uma ocorrência com foto: localização, câmera, envio da foto e registro da denúncia.
// Usado pela tela de instruções e, quando o usuário escolhe pular as instruções, pelo botão de câmera da Home.
export function useRegistrarOcorrencia(usuario: Usuario | null) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  async function registrarComFoto() {
    if (isSubmitting || !usuario) {
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
      const reportId = `${usuario.id}-${Date.now()}`;
      const uploadedPhoto = await uploadReportPhoto({
        uri: asset.uri,
        userId: usuario.id,
        reportId,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });

      try {
        await registrarDenuncia({
          id: reportId,
          id_denunciador: usuario.id,
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

  return { isSubmitting, previewUri, registrarComFoto };
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
