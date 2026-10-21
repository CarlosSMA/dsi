import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppColors } from '@/constants/theme';
import { useAuth } from '@/src/contexts/auth-context';
import { useRegistrarOcorrencia } from '@/src/features/report/useRegistrarOcorrencia';
import { getPreference, ocultarInstrucoesFotoKey } from '@/src/lib/preferences';

const SIZE = 60;

export function PhotoReportEntry() {
  const router = useRouter();
  const { usuario } = useAuth();
  const { isSubmitting, registrarComFoto } = useRegistrarOcorrencia(usuario);

  // Se o usuário marcou "Não mostrar estas instruções novamente", vai direto para a foto.
  async function handlePress() {
    const ocultarInstrucoes = usuario
      ? await getPreference(ocultarInstrucoesFotoKey(usuario.id)).catch(() => null)
      : null;

    if (ocultarInstrucoes === 'true') {
      await registrarComFoto();
    } else {
      router.push('/photo-report');
    }
  }

  return (
    // A faixa ocupa a largura toda só para centralizar o botão; os toques fora dele passam para o mapa.
    <View pointerEvents="box-none" style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Registrar uma ocorrência com foto"
        disabled={isSubmitting}
        style={({ pressed }) => [styles.button, (pressed || isSubmitting) && styles.buttonPressed]}
        onPress={handlePress}>
        {isSubmitting ? (
          <ActivityIndicator color={AppColors.surface} />
        ) : (
          <MaterialIcons name="photo-camera" size={28} color={AppColors.surface} />
        )}
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
