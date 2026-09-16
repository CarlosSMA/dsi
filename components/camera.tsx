import { AppColors } from "@/constants/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { styles } from "@/constants/style";
import { useAuth } from "@/src/contexts/auth-context";
import { registrarDenuncia } from "@/src/services/denuncia-service";

interface Location {
  latitude: number;
  longitude: number;
}

interface CameraProps {
  cameraType?: ImagePicker.CameraType;
  quality?: number;
  location?: Location;
}

export function Camera({
  cameraType,
  quality,
  location,
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
            location,
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
  location?: Location;
  usuarioId?: string;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
}

async function handleTakePhoto({
  cameraType,
  quality,
  location,
  usuarioId,
  isSubmitting,
  setIsSubmitting,
}: HandleTakePhotoParams) {
  if (isSubmitting) {
    return;
  }

  if (!location) {
    Alert.alert(
      'Localização necessária',
      'Não foi possível obter sua localização para registrar a ocorrência.'
    );
    return;
  }

  setIsSubmitting(true);
  try {
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

async function getCurrentLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      'Localização necessária',
      'Permita o acesso à localização para registrar uma ocorrência com suas coordenadas.'
    );
    return null;
  }

  try {
    const currentLocation = await Location.getCurrentPositionAsync({});
    return currentLocation.coords;
  } catch (error) {
    console.error('Erro ao obter localização:', error);
    Alert.alert(
      'Localização indisponível',
      'Não foi possível obter sua localização. Verifique se o GPS está ativado e tente novamente.'
    );
    return null;
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
