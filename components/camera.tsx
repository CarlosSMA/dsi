import { AppColors } from "@/constants/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { styles } from "@/constants/style";
import { useAuth } from "@/src/contexts/auth-context";
import { registrarDenuncia } from "@/src/services/denuncia-service";
import { Gps } from "@/src/lib/gps";

interface CameraProps {
  cameraType?: ImagePicker.CameraType;
  quality?: number;
}

export function Camera({
  cameraType,
  quality,
}: CameraProps) {
  const { usuario } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <View style={styles.cameraContainer}>
      <Pressable
        style={styles.cameraButton}
        disabled={isSubmitting}
        onPress={() =>
          handleTakePhoto({
            cameraType,
            quality,
            usuarioId: usuario?.id,
            isSubmitting,
            setIsSubmitting,
          })
        }>
        <MaterialIcons name="photo-camera" size={30} color={AppColors.surface} />
      </Pressable>
    </View>
  )
}

interface HandleTakePhotoParams {
  cameraType?: ImagePicker.CameraType;
  quality?: number;
  usuarioId?: string;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
}

async function handleTakePhoto({
  cameraType,
  quality,
  usuarioId,
  isSubmitting,
  setIsSubmitting,
}: HandleTakePhotoParams) {
  if (isSubmitting) {
    return;
  }

  setIsSubmitting(true);
  try {
    const location = await Gps.getCurrentLocation();
    if (!location) {
      return;
    }

    const result = await takePhoto(cameraType, quality);
    if (!result || result.canceled) {
      return;
    }

    if (!usuarioId) {
      Alert.alert('Sessão necessária', 'Entre na sua conta para registrar uma ocorrência.');
      return;
    }

    await registrarDenuncia({
      id_denunciador: usuarioId,
      latitude: location.latitude,
      longitude: location.longitude,
    });
    Alert.alert('Ocorrência registrada', 'Sua ocorrência foi enviada para análise.');
  } catch (error) {
    console.error('Erro ao registrar ocorrência:', error);
    Alert.alert('Erro', 'Não foi possível registrar a ocorrência. Tente novamente.');
  } finally {
    setIsSubmitting(false);
  }
}

async function takePhoto(
  cameraType?: ImagePicker.CameraType.back | ImagePicker.CameraType.front,
  quality?: number
) {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      'Permissão necessária',
      'Permita o acesso à câmera para registrar uma ocorrência.'
    );
    return null;
  }

  return ImagePicker.launchCameraAsync({
    allowsEditing: false,
    cameraType: cameraType ? cameraType : ImagePicker.CameraType.back,
    quality: quality ? quality : 0.5,
  });
}
