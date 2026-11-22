import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useState } from 'react';
import { Alert } from 'react-native';

import { takePhoto } from '@/components/camera';
import { Gps } from '@/src/lib/gps';
import { Denuncias } from '@/src/models/Denuncia';
import {
  removeMultipleReportPhotos,
  uploadMultipleReportPhotos,
} from '@/src/services/photo-service';
import type { Usuario } from '@/src/types';

export interface FotoItem {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

const MAX_FOTOS = 4;

/**
 * Hook de Registro de Ocorrência com suporte a Múltiplas Fotos do Foco.
 * Permite capturar e enviar até 4 fotos com ângulos distintos do criadouro.
 */
export function useRegistrarOcorrencia(usuario: Usuario | null) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fotos, setFotos] = useState<FotoItem[]>([]);

  // Para compatibilidade com componentes que leem apenas a primeira foto
  const previewUri = fotos[0]?.uri || null;

  async function capturarFoto(): Promise<boolean> {
    if (fotos.length >= MAX_FOTOS) {
      Alert.alert('Limite atingido', `Você pode anexar no máximo ${MAX_FOTOS} fotos por denúncia.`);
      return false;
    }

    try {
      const result = await takePhoto(ImagePicker.CameraType.back, 0.7);
      if (!result || result.canceled || !result.assets[0]) {
        return false;
      }

      const asset = result.assets[0];
      setFotos((prev) => [
        ...prev,
        {
          uri: asset.uri,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
        },
      ]);
      return true;
    } catch (error) {
      console.error('Erro ao abrir câmera:', error);
      Alert.alert('Erro', 'Não foi possível acessar a câmera do dispositivo.');
      return false;
    }
  }

  async function selecionarDaGaleria(): Promise<boolean> {
    if (fotos.length >= MAX_FOTOS) {
      Alert.alert('Limite atingido', `Você pode anexar no máximo ${MAX_FOTOS} fotos por denúncia.`);
      return false;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria para anexar fotos.');
        return false;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_FOTOS - fotos.length,
        quality: 0.7,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return false;
      }

      const novasFotos: FotoItem[] = result.assets.map((asset) => ({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      }));

      setFotos((prev) => [...prev, ...novasFotos].slice(0, MAX_FOTOS));
      return true;
    } catch (error) {
      console.error('Erro ao abrir galeria:', error);
      Alert.alert('Erro', 'Não foi possível acessar a galeria de imagens.');
      return false;
    }
  }

  function removerFoto(index: number) {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  }

  function limparFotos() {
    setFotos([]);
  }

  async function enviarOcorrencia(onSuccess?: () => void) {
    if (isSubmitting || !usuario) {
      return;
    }

    if (fotos.length === 0) {
      Alert.alert('Atenção', 'Tire ao menos uma foto do foco antes de enviar a denúncia.');
      return;
    }

    setIsSubmitting(true);

    try {
      const location = await Gps.getCurrentLocation();
      if (!location) {
        return;
      }

      const bairro = await getNeighborhood(location.latitude, location.longitude);
      const reportId = `${usuario.id}-${Date.now()}`;

      // Upload assíncrono em lote de todas as fotos para o bucket do Supabase
      const uploadedPhotos = await uploadMultipleReportPhotos(fotos, usuario.id, reportId);
      const urlsFotos = uploadedPhotos.map((p) => p.url);
      const pathsParaRemocao = uploadedPhotos.map((p) => p.path);

      try {
        await Denuncias.registrar({
          id: reportId,
          id_denunciador: usuario.id,
          latitude: location.latitude,
          longitude: location.longitude,
          bairro,
          urlFoto: urlsFotos[0] || '',
          urlsFotos,
        });
      } catch (error) {
        // Em caso de falha no Firestore, remove as fotos órfãs do Supabase
        await removeMultipleReportPhotos(pathsParaRemocao);
        throw error;
      }

      limparFotos();
      Alert.alert(
        'Denúncia Registrada!',
        `Sua ocorrência com ${urlsFotos.length} ${urlsFotos.length === 1 ? 'foto foi enviada' : 'fotos foram enviadas'} para análise da Vigilância Ambiental da Prefeitura do Recife.`,
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error) {
      console.error('Erro ao enviar denúncia:', error);
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Mantém fluxo one-shot legado para acionamento direto (ex: botão de câmera da Home)
  async function registrarComFoto() {
    const fotoAdicionada = await capturarFoto();
    if (fotoAdicionada) {
      await enviarOcorrencia();
    }
  }

  return {
    isSubmitting,
    fotos,
    previewUri,
    maxFotos: MAX_FOTOS,
    capturarFoto,
    selecionarDaGaleria,
    removerFoto,
    limparFotos,
    enviarOcorrencia,
    registrarComFoto,
  };
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
