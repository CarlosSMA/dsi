import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { AppColors } from '@/constants/theme';
import MapSurface from '@/components/map-surface';
import { Camera } from '@/components/camera';
import { styles } from '@/constants/style';

export default function MapScreen() {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permissão necessária',
        'Permita o acesso à câmera para registrar uma ocorrência.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      cameraType: ImagePicker.CameraType.front,
      quality: 0.5,
    });

    if (!result.canceled) {
      setCapturedPhoto(result.assets[0].uri);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <View style={styles.mapSurface} accessibilityLabel="Mapa de Recife">
          <MapSurface />

          <View style={styles.topControls}>
            <View style={styles.searchField}>
              <MaterialIcons name="search" size={25} color={AppColors.primaryText} />
              <TextInput
                accessibilityLabel="Pesquisar região"
                placeholder="Pesquisar"
                placeholderTextColor={AppColors.secondaryText}
                style={styles.searchInput}
              />
            </View>

            <View
              accessibilityLabel="Perfil"
              style={styles.profileButton}
              accessible
              pointerEvents="none">
              <MaterialIcons name="person" size={28} color={AppColors.primaryText} />
            </View>
          </View>

          <View>
            <Camera></Camera>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
