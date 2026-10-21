import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet } from 'react-native';

import { AppColors } from '@/constants/theme';

interface MapLocateButtonProps {
  onPress: () => void;
}

export function MapLocateButton({ onPress }: MapLocateButtonProps) {
  return (
    <Pressable
      accessibilityLabel="Centralizar na minha localização"
      accessibilityRole="button"
      onPress={onPress}
      style={styles.button}>
      <MaterialIcons name="my-location" size={22} color={AppColors.actionBlue} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 84,
    right: 18,
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
});
