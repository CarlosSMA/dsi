import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MapFocus } from '@/constants/map';
import { AppColors } from '@/constants/theme';

interface MapResultCardProps {
  focus: MapFocus;
  onClose: () => void;
}

export function MapResultCard({ focus, onClose }: MapResultCardProps) {
  const isBairro = focus.scope === 'bairro';

  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <MaterialIcons
          name={focus.isArea ? 'map' : isBairro ? 'holiday-village' : 'place'}
          size={22}
          color={AppColors.actionBlue}
        />
      </View>

      <View style={styles.texts}>
        <Text style={styles.eyebrow}>{focus.isArea ? 'REGIÃO' : isBairro ? 'BAIRRO' : 'RUA'}</Text>
        <Text numberOfLines={1} style={styles.title}>
          {focus.title}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {focus.subtitle}
        </Text>
      </View>

      <Pressable
        accessibilityLabel="Fechar resultado da busca"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onClose}>
        <MaterialIcons name="close" size={22} color={AppColors.secondaryText} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
  },
  texts: {
    flex: 1,
    gap: 1,
  },
  eyebrow: {
    color: AppColors.actionBlue,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    color: AppColors.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: AppColors.secondaryText,
    fontSize: 13,
  },
});
