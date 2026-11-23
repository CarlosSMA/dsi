import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MosquitoBadge } from '@/components/mosquito-badge';
import { RISCO_AREA_AVISO, RISCO_AREA_ESTILO } from '@/constants/map';
import { AppColors } from '@/constants/theme';
import type { NivelRisco } from '@/src/features/profile/utils/score-priorizacao';

interface RiscoRegiaoCardProps {
  bairro: string;
  nivel: NivelRisco;
  onClose: () => void;
}

// Aviso que aparece ao tocar na bolinha do mosquito de um bairro.
export function RiscoRegiaoCard({ bairro, nivel, onClose }: RiscoRegiaoCardProps) {
  const aviso = RISCO_AREA_AVISO[nivel];

  return (
    <View style={[styles.card, { borderColor: RISCO_AREA_ESTILO[nivel].border }]} accessibilityLiveRegion="polite">
      <MosquitoBadge nivel={nivel} size={52} />

      <View style={styles.texts}>
        <Text numberOfLines={1} style={styles.eyebrow}>
          BAIRRO · {bairro.toUpperCase()}
        </Text>
        <Text style={[styles.title, { color: RISCO_AREA_ESTILO[nivel].texto }]}>{aviso.titulo}</Text>
        <Text style={styles.message}>{aviso.texto}</Text>
      </View>

      <Pressable accessibilityLabel="Fechar aviso do bairro" accessibilityRole="button" hitSlop={8} onPress={onClose}>
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
    borderWidth: 2,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    color: AppColors.secondaryText,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  message: {
    color: AppColors.primaryText,
    fontSize: 13,
    lineHeight: 18,
  },
});
