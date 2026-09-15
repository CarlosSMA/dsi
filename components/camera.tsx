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
            usuarioId: usuario!.id,
            isSubmitting,
            setIsSubmitting,
          })
        }>
        <MaterialIcons name="photo-camera" size={30} color={AppColors.surface} />
      </Pressable>
    </View>
  )
}


  if (!location) {
    Alert.alert(
      'Localização necessária',
      'Não foi possível obter sua localização para registrar a ocorrência.'
    );
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
