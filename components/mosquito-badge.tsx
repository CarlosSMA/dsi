import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { RISCO_AREA_ESTILO } from '@/constants/map';
import type { NivelRisco } from '@/src/features/profile/utils/score-priorizacao';

// Mascote do mosquito em cada nível de risco: sorrindo, preocupado e assustado.
export const MOSQUITO_IMAGEM: Record<NivelRisco, ImageSourcePropType> = {
  baixo: require('@/assets/images/mosquito/mosquito-baixo.png'),
  medio: require('@/assets/images/mosquito/mosquito-medio.png'),
  alto: require('@/assets/images/mosquito/mosquito-alto.png'),
};

interface MosquitoBadgeProps {
  nivel: NivelRisco;
  size?: number;
  // O Apple Maps só desenha o marcador depois que a imagem carrega; avisa quando isso acontece.
  onLoad?: () => void;
}

// Bolinha com o mosquito da dengue, na cor e com a expressão do nível de risco da região.
export function MosquitoBadge({ nivel, size = 40, onLoad }: MosquitoBadgeProps) {
  return (
    <View
      style={[
        styles.bubble,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: RISCO_AREA_ESTILO[nivel].badge },
      ]}>
      <Image
        source={MOSQUITO_IMAGEM[nivel]}
        style={{ width: size * 0.78, height: size * 0.78 }}
        onLoad={onLoad}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#1A1A1A',
  },
});
