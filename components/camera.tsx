import { AppColors } from "@/constants/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Alert, Pressable, View } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { styles } from "@/constants/style";

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
