import { AppColors } from "@/constants/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from 'expo-image';
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { styles } from "@/constants/style";
import { useAuth } from "@/src/contexts/auth-context";
import { registrarDenuncia } from "@/src/services/denuncia-service";
import { Gps } from "@/src/lib/gps";
import { getSecureItem, setSecureItem } from "@/src/lib/secureStorage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SKIP_INSTRUCTIONS_KEY = 'skip-denuncia-instructions';

interface CameraProps {
  cameraType?: ImagePicker.CameraType;
  quality?: number;
}

export function Camera({
  cameraType,
  quality,
}: CameraProps) {
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [instructionsVisible, setInstructionsVisible] = useState(false);
  const [skipInstructions, setSkipInstructions] = useState(false);

  async function handleCameraPress() {
    if (isSubmitting) {
      return;
    }

    const shouldSkip = await getSecureItem(SKIP_INSTRUCTIONS_KEY);
    if (shouldSkip === 'true') {
      await startPhotoFlow();
      return;
    }

    setInstructionsVisible(true);
  }

  async function startPhotoFlow() {
    await handleTakePhoto({
      cameraType,
      quality,
      usuarioId: usuario?.id,
      isSubmitting,
      setIsSubmitting,
    });
  }

  async function handleContinue() {
    if (skipInstructions) {
      await setSecureItem(SKIP_INSTRUCTIONS_KEY, 'true');
    }

    setInstructionsVisible(false);
    await startPhotoFlow();
  }

  return (
    <>
      <View style={styles.cameraContainer}>
        <Pressable
          style={styles.cameraButton}
          disabled={isSubmitting}
          onPress={handleCameraPress}>
          <MaterialIcons name="photo-camera" size={30} color={AppColors.surface} />
        </Pressable>
      </View>

      <Modal
        visible={instructionsVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setInstructionsVisible(false)}>
        <View style={instructionStyles.modal}>
          <View style={[instructionStyles.header, { paddingTop: insets.top }]}>
            <Pressable
              accessibilityLabel="Voltar"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => setInstructionsVisible(false)}>
              <MaterialIcons name="arrow-back" size={22} color={AppColors.securityBlue} />
            </Pressable>

            <View style={instructionStyles.brand}>
              <Image
                source={require('@/assets/images/vetor-risco-logo.png')}
                contentFit="contain"
                style={instructionStyles.brandLogo}
              />
              <View>
                <Text style={instructionStyles.brandName}>VetorRisco</Text>
                <Text style={instructionStyles.brandSubtitle}>RECIFE</Text>
              </View>
            </View>

            <MaterialIcons name="help-outline" size={16} color="#94A3B8" />
          </View>

          <ScrollView
            style={instructionStyles.content}
            contentContainerStyle={instructionStyles.contentContainer}
            showsVerticalScrollIndicator={false}>
            <View style={instructionStyles.introCard}>
              <View style={instructionStyles.cameraIcon}>
                <MaterialIcons name="photo-camera" size={22} color={AppColors.surface} />
              </View>
              <View style={instructionStyles.introText}>
                <Text style={instructionStyles.eyebrow}>ETAPA PRÉVIA • CÂMERA</Text>
                <Text style={instructionStyles.title}>Antes de fazer sua denúncia</Text>
              </View>
            </View>

            <Text style={instructionStyles.description}>
              Para registrar uma ocorrência com rapidez e eficácia no combate aos vetores, siga estas orientações:
            </Text>

            <InstructionStep
              step="1"
              title="Identifique o foco"
              description="Localize o possível criadouro ou situação de risco."
              tipIcon="water-drop"
              tip="Ex: caixas d'água abertas, pneus, entulho, calhas"
            />
            <InstructionStep
              step="2"
              title="Tire uma foto nítida"
              description="Procure registrar o local com boa visibilidade."
              tipIcon="wb-sunny"
              tip="Prefira luz natural e evite imagens tremidas"
            />
            <InstructionStep
              step="3"
              title="Confirme sua localização"
              description="Verifique se o ponto indicado no mapa está correto."
              tipIcon="location-on"
              tip="GPS ativo garante precisão para o agente de saúde"
            />

            <View style={instructionStyles.warning}>
              <View style={instructionStyles.warningIcon}>
                <MaterialIcons name="warning" size={15} color="#B45309" />
              </View>
              <View style={instructionStyles.warningText}>
                <Text style={instructionStyles.warningTitle}>Atenção à sua segurança</Text>
                <Text style={instructionStyles.warningBody}>
                  <Text style={instructionStyles.warningStrong}>Não se coloque em risco para registrar uma ocorrência.</Text>
                  {'\n'}Mantenha distância de locais perigosos, muros instáveis ou áreas de difícil acesso.
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={[instructionStyles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <Pressable
              style={instructionStyles.checkboxRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: skipInstructions }}
              onPress={() => setSkipInstructions((checked) => !checked)}>
              <View style={[instructionStyles.checkbox, skipInstructions && instructionStyles.checkboxChecked]}>
                {skipInstructions && <MaterialIcons name="check" size={13} color={AppColors.surface} />}
              </View>
              <Text style={instructionStyles.checkboxLabel}>Não mostrar estas instruções novamente</Text>
            </Pressable>

            <Pressable
              style={instructionStyles.continueButton}
              accessibilityRole="button"
              onPress={handleContinue}>
              <Text style={instructionStyles.continueLabel}>Entendi, fazer denúncia</Text>
              <MaterialIcons name="arrow-forward" size={17} color={AppColors.surface} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  )
}

interface InstructionStepProps {
  step: string;
  title: string;
  description: string;
  tipIcon: keyof typeof MaterialIcons.glyphMap;
  tip: string;
}

function InstructionStep({ step, title, description, tipIcon, tip }: InstructionStepProps) {
  return (
    <View style={instructionStyles.stepCard}>
      <View style={instructionStyles.checkCircle}>
        <MaterialIcons name="check" size={14} color={AppColors.safe} />
      </View>
      <View style={instructionStyles.stepBody}>
        <View style={instructionStyles.stepHeading}>
          <Text style={instructionStyles.stepTitle}>{title}</Text>
          <Text style={instructionStyles.stepNumber}>Passo {step}</Text>
        </View>
        <Text style={instructionStyles.stepDescription}>{description}</Text>
        <View style={instructionStyles.tip}>
          <MaterialIcons name={tipIcon} size={13} color={AppColors.actionBlue} />
          <Text style={instructionStyles.tipText}>{tip}</Text>
        </View>
      </View>
    </View>
  );
}

const instructionStyles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: AppColors.appBackground,
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
    borderStyle: 'dotted',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  brandLogo: {
    width: 22,
    height: 26,
  },
  brandName: {
    color: AppColors.primaryText,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  brandSubtitle: {
    color: AppColors.actionBlue,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    lineHeight: 10,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    gap: 9,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 94,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#F8FBFF',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cameraIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: AppColors.actionBlue,
  },
  introText: {
    flex: 1,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    marginBottom: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: '#DBEAFE',
    color: AppColors.actionBlue,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  title: {
    color: AppColors.primaryText,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  description: {
    marginHorizontal: 2,
    color: '#334155',
    fontSize: 12,
    lineHeight: 18,
  },
  stepCard: {
    flexDirection: 'row',
    minHeight: 106,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: AppColors.surface,
  },
  checkCircle: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    marginRight: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  stepBody: {
    flex: 1,
  },
  stepHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepTitle: {
    flex: 1,
    color: AppColors.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  stepNumber: {
    color: '#94A3B8',
    fontSize: 10,
  },
  stepDescription: {
    marginTop: 3,
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 25,
    marginTop: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: '#F8FAFC',
  },
  tipText: {
    flex: 1,
    color: '#64748B',
    fontSize: 10,
    lineHeight: 14,
  },
  warning: {
    flexDirection: 'row',
    padding: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
  },
  warningIcon: {
    width: 21,
    height: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
    borderRadius: 5,
    backgroundColor: '#FEF3C7',
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
  },
  warningBody: {
    marginTop: 2,
    color: '#92400E',
    fontSize: 11,
    lineHeight: 15,
  },
  warningStrong: {
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: AppColors.surface,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
    gap: 7,
  },
  checkbox: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#94A3B8',
    backgroundColor: AppColors.surface,
  },
  checkboxChecked: {
    borderColor: AppColors.actionBlue,
    backgroundColor: AppColors.actionBlue,
  },
  checkboxLabel: {
    color: AppColors.primaryText,
    fontSize: 12,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginTop: 5,
    borderRadius: 10,
    backgroundColor: AppColors.actionBlue,
    shadowColor: AppColors.actionBlue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  continueLabel: {
    marginRight: 6,
    color: AppColors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
});

interface HandleTakePhotoParams {
  cameraType?: ImagePicker.CameraType;
  quality?: number;
  usuarioId?: string;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
}

async function handleTakePhoto({
  cameraType,
  quality,
  usuarioId,
  isSubmitting,
  setIsSubmitting,
}: HandleTakePhotoParams) {
  if (isSubmitting) {
    return;
  }

  setIsSubmitting(true);
  try {
    const location = await Gps.getCurrentLocation();
    if (!location) {
      return;
    }

    const result = await takePhoto(cameraType, quality);
    if (!result || result.canceled) {
      return;
    }

    if (!usuarioId) {
      Alert.alert('Sessão necessária', 'Entre na sua conta para registrar uma ocorrência.');
      return;
    }

    await registrarDenuncia({
      id_denunciador: usuarioId,
      latitude: location.latitude,
      longitude: location.longitude,
    });
    Alert.alert('Ocorrência registrada', 'Sua ocorrência foi enviada para análise.');
  } catch (error) {
    console.error('Erro ao registrar ocorrência:', error);
    Alert.alert('Erro', 'Não foi possível registrar a ocorrência. Tente novamente.');
  } finally {
    setIsSubmitting(false);
  }
}

async function takePhoto(
  cameraType?: ImagePicker.CameraType.back | ImagePicker.CameraType.front,
  quality?: number
) {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      'Permissão necessária',
      'Permita o acesso à câmera para registrar uma ocorrência.'
    );
    return null;
  }

  return ImagePicker.launchCameraAsync({
    allowsEditing: false,
    cameraType: cameraType ? cameraType : ImagePicker.CameraType.back,
    quality: quality ? quality : 0.5,
  });
}
