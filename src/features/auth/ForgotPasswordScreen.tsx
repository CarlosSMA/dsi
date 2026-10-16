import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppColors } from '@/constants/theme';
import { formatCpf } from './utils/cpf';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from './forgotPasswordSchema';
import { useForgotPassword } from './useForgotPassword';

export function ForgotPasswordScreen() {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const { error, successEmail, isSuccess, handleResetPassword, resetState } = useForgotPassword();

  const {
    control,
    handleSubmit: submitForm,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      identificador: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData): Promise<void> => {
    await handleResetPassword(data);
  };

  const handleInputChange = (text: string, onChange: (value: string) => void) => {
    resetState();
    // Se o usuário estiver digitando apenas números/pontos (CPF), aplica a máscara do CPF
    const isPotentiallyCpf = !text.includes('@') && /^[0-9.\-]*$/.test(text);
    if (isPotentiallyCpf && text.replace(/\D/g, '').length > 0) {
      onChange(formatCpf(text));
    } else {
      onChange(text);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          
          {/* Top Bar com Botão Voltar e Logo Oficial VetorRisco */}
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar para login"
              onPress={() => router.back()}
              style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={20} color={AppColors.primaryText} />
            </Pressable>

            <View style={styles.brandCenter}>
              <Image
                source={require('@/assets/images/vetor-risco-logo.png')}
                contentFit="contain"
                style={styles.logoImage}
              />
              <Text style={styles.brandTitle}>VetorRisco</Text>
            </View>

            {/* Espaçador para manter alinhamento centralizado do cabeçalho */}
            <View style={styles.headerSpacer} />
          </View>

          {/* Card Principal: Recuperação de Acesso */}
          <View style={styles.mainCard}>
            {/* Badge de Recuperação */}
            <View style={styles.badge}>
              <MaterialIcons name="lock" size={13} color={AppColors.securityBlue} />
              <Text style={styles.badgeText}>RECUPERAÇÃO DE ACESSO</Text>
            </View>

            {/* Ícone Circular com Badge de Confirmação */}
            <View style={styles.circleIconContainer}>
              <View style={styles.circleIcon}>
                <MaterialIcons name="lock-reset" size={32} color={AppColors.actionBlue} />
                <View style={styles.badgeCheck}>
                  <MaterialIcons name="check" size={11} color="#FFFFFF" />
                </View>
              </View>
            </View>

            {/* Título e Instruções */}
            <Text style={styles.cardTitle}>Recuperar senha</Text>
            <Text style={styles.cardDescription}>
              Informe seu e-mail ou CPF cadastrado. Enviaremos um link de confirmação para você
              redefinir sua senha com segurança.
            </Text>
          </View>

          {/* Formulário de Identificação */}
          <View style={styles.formContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>E-mail ou CPF</Text>
              <Text style={styles.requiredAsterisk}> *</Text>
            </View>

            <Controller
              control={control}
              name="identificador"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
                  <MaterialIcons
                    name="badge"
                    size={20}
                    color={isFocused ? AppColors.actionBlue : '#64748B'}
                  />
                  <TextInput
                    value={value}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                      setIsFocused(false);
                      onBlur();
                    }}
                    onChangeText={(text) => handleInputChange(text, onChange)}
                    placeholder="E-mail ou CPF"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    style={styles.input}
                  />
                </View>
              )}
            />

            {errors.identificador?.message ? (
              <Text style={styles.errorText}>{errors.identificador.message}</Text>
            ) : null}

            {error ? <Text style={styles.formErrorText}>{error}</Text> : null}

            {/* Banner de Sucesso */}
            {isSuccess ? (
              <View style={styles.successBanner}>
                <MaterialIcons name="check-circle" size={22} color={AppColors.safe} />
                <View style={styles.successTextContainer}>
                  <Text style={styles.successTitle}>Instruções enviadas!</Text>
                  <Text style={styles.successMessage}>
                    Enviamos o link de redefinição para o e-mail vinculado ({successEmail}). Verifique
                    sua caixa de entrada e a pasta de spam.
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Card Informativo de Privacidade e Governança */}
            <View style={styles.securityNoticeCard}>
              <MaterialIcons name="security" size={22} color={AppColors.actionBlue} />
              <Text style={styles.securityNoticeText}>
                Seus dados estão protegidos conforme as diretrizes de privacidade e governança digital
                da Prefeitura do Recife.
              </Text>
            </View>

            {/* Botão de Ação CTA */}
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={submitForm(onSubmit)}
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Enviar instruções</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </Pressable>

            {/* Link para Voltar ao Login */}
            <View style={styles.loginLinkRow}>
              <Text style={styles.loginLinkText}>Lembrou sua senha? </Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/login')}>
                <Text style={styles.loginLinkAnchor}>Fazer login</Text>
              </Pressable>
            </View>
          </View>

          {/* Rodapé Institucional */}
          <View style={styles.footerContainer}>
            <View style={styles.officialChannelRow}>
              <View style={styles.greenStatusDot} />
              <Text style={styles.officialChannelText}>
                Canal Oficial de Vigilância Entomológica
              </Text>
            </View>
            <Text style={styles.departmentText}>
              Prefeitura do Recife • Vigilância Ambiental
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.appBackground,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.inactive,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  brandCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoImage: {
    width: 26,
    height: 32,
  },
  brandTitle: {
    color: AppColors.securityBlue,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 42,
  },
  mainCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 6,
    marginBottom: 16,
  },
  badgeText: {
    color: AppColors.securityBlue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  circleIconContainer: {
    marginBottom: 16,
  },
  circleIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeCheck: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: AppColors.securityBlue,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    color: AppColors.securityBlue,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardDescription: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  formContainer: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    color: AppColors.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  requiredAsterisk: {
    color: AppColors.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderWidth: 1.5,
    borderColor: AppColors.inactive,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 14,
    gap: 10,
  },
  inputWrapperFocused: {
    borderColor: AppColors.actionBlue,
  },
  input: {
    flex: 1,
    color: AppColors.primaryText,
    fontSize: 15,
  },
  errorText: {
    color: AppColors.highRisk,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  formErrorText: {
    color: AppColors.highRisk,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    gap: 10,
  },
  successTextContainer: {
    flex: 1,
  },
  successTitle: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  successMessage: {
    color: '#047857',
    fontSize: 12,
    lineHeight: 17,
  },
  securityNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    gap: 12,
  },
  securityNoticeText: {
    flex: 1,
    color: '#1E40AF',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.actionBlue,
    borderRadius: 12,
    height: 50,
    marginTop: 20,
    gap: 8,
    shadowColor: AppColors.actionBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  loginLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginLinkText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500',
  },
  loginLinkAnchor: {
    color: AppColors.actionBlue,
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 20,
    gap: 4,
  },
  officialChannelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: AppColors.safe,
  },
  officialChannelText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  departmentText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
});
