import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { AppColors, Fonts } from '@/constants/theme';
import MapSurface from '@/components/map-surface';

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
      cameraType: ImagePicker.CameraType.back,
      quality: 1,
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

          <Pressable
            accessibilityLabel={capturedPhoto ? 'Câmera (foto capturada)' : 'Câmera'}
            style={styles.cameraButton}
            onPress={takePhoto}>
            <MaterialIcons name="photo-camera" size={30} color={AppColors.surface} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.appBackground,
  },
  screen: {
    flex: 1,
    backgroundColor: AppColors.appBackground,
  },
  mapSurface: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: AppColors.appBackground,
  },
  topControls: {
    position: 'absolute',
    top: 16,
    left: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchField: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 28,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    color: AppColors.primaryText,
    fontFamily: Fonts?.sans,
    fontSize: 18,
  },
  profileButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 43,
    backgroundColor: AppColors.actionBlue,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 6,
  },
});
