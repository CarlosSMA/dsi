import { AppColors } from "@/constants/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { styles } from "@/constants/style";

interface CameraProps {
  cameraType?: ImagePicker.CameraType;
  quality?: number;
  onPhotoTaken?: (asset: ImagePicker.ImagePickerAsset) => Promise<void> | void;
}

export function Camera({
  cameraType,
  quality,
  onPhotoTaken,
}: CameraProps) {
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
            onPhotoTaken,
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
  onPhotoTaken?: (asset: ImagePicker.ImagePickerAsset) => Promise<void> | void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
}

async function handleTakePhoto({
  cameraType,
  quality,
  onPhotoTaken,
  isSubmitting,
  setIsSubmitting,
}: HandleTakePhotoParams) {
  if (isSubmitting) {
    return;
  }

  setIsSubmitting(true);
  try {
    const result = await takePhoto(cameraType, quality);
    if (!result || result.canceled || !result.assets[0]) {
      return;
    }

    await onPhotoTaken?.(result.assets[0]);
  } catch (error) {
    console.error('Erro ao registrar ocorrência:', error);
    Alert.alert('Erro', 'Não foi possível registrar a ocorrência. Tente novamente.');
  } finally {
    setIsSubmitting(false);
  }
}

export async function takePhoto(
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
