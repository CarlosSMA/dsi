import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppColors } from '@/constants/theme';

const SIZE = 60;

export function PhotoReportEntry() {
  const router = useRouter();

  return (
    // A faixa ocupa a largura toda só para centralizar o botão; os toques fora dele passam para o mapa.
    <View pointerEvents="box-none" style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir página para registrar uma ocorrência"
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => router.push('/photo-report')}>
        <MaterialIcons name="photo-camera" size={28} color={AppColors.surface} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 28,
    alignItems: 'center',
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: AppColors.actionBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
