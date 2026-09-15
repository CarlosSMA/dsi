import { AppColors } from "@/constants/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Alert, Pressable, View } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { styles } from "@/constants/style";
import { useAuth } from "@/src/contexts/auth-context";

interface Location {
  latitude: number;
  longitude: number;
}

interface CameraProps {
  cameraType?: ImagePicker.CameraType;
  quality?: number;
  location: Location;
}

export function Camera({
  cameraType,
  quality,
  location,
}: CameraProps) {
  const { usuario } = useAuth();
      const result = await takePhoto(cameraType, quality);
      if (!result || result.canceled) {
        return;
      }

      if (!usuario) {
        Alert.alert('Sessão necessária', 'Entre na sua conta para registrar uma ocorrência.');
        return;
      }
      await registrarDenuncia({
        id_denunciador: usuario.id,
        latitude: location.latitude,
        longitude: location.longitude,
      });
  return (
    <View style={styles.cameraContainer}>
      <Pressable
        style={styles.cameraButton}
        onPress={async () => takePhoto(cameraType, quality)}>
        <MaterialIcons name="photo-camera" size={30} color={AppColors.surface} />
      </Pressable>
    </View>
  )
}

    await registrarDenuncia({
      id_denunciador: usuarioId,
      latitude: location.latitude,
      longitude: location.longitude,
    });
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
    return;
  }

  return await ImagePicker.launchCameraAsync({
    allowsEditing: false,
    cameraType: cameraType ? cameraType : ImagePicker.CameraType.back,
    quality: quality ? quality : 0.5,
  });
}
