import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AppColors, Fonts } from '@/constants/theme';

export function PhotoReportEntry() {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Abrir página para registrar uma ocorrência"
      style={styles.button}
      onPress={() => router.push('/photo-report')}>
      <MaterialIcons name="photo-camera" size={26} color={AppColors.surface} />
      <Text style={styles.label}>TIRAR DEPOIS</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 28,
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: AppColors.actionBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 6,
  },
  label: {
    color: AppColors.surface,
    fontFamily: Fonts?.sans,
    fontSize: 16,
    fontWeight: '700',
  },
});
