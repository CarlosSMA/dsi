import { StyleSheet, Text, View } from 'react-native';

import { RISCO_AREA_ESTILO } from '@/constants/map';
import { AppColors } from '@/constants/theme';
import type { NivelRisco } from '@/src/features/profile/utils/score-priorizacao';

const ITENS: { nivel: NivelRisco; rotulo: string }[] = [
  { nivel: 'baixo', rotulo: 'Risco baixo' },
  { nivel: 'medio', rotulo: 'Risco moderado' },
  { nivel: 'alto', rotulo: 'Risco crítico' },
];

// Legenda no canto inferior direito do mapa: o que cada cor das regiões significa.
export function MapaRiscoLegenda() {
  return (
    <View style={styles.container} accessibilityLabel="Legenda: verde risco baixo, amarelo risco moderado, vermelho risco crítico">
      {ITENS.map(({ nivel, rotulo }) => (
        <View key={nivel} style={styles.item}>
          <View
            style={[
              styles.swatch,
              { backgroundColor: RISCO_AREA_ESTILO[nivel].badge, borderColor: RISCO_AREA_ESTILO[nivel].border },
            ]}
          />
          <Text style={styles.label}>{rotulo}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Acima do crédito do mapa e abaixo da altura dos cards de resultado e de aviso.
  container: {
    position: 'absolute',
    right: 12,
    bottom: 18,
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  label: {
    color: AppColors.primaryText,
    fontSize: 11,
    fontWeight: '600',
  },
});
