import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
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
import { signupSchema, type SignupFormData } from './signupSchema';
import { useSignup } from './useSignup';

export function SignupScreen() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const router = useRouter();
  const { error: signupError, handleSubmit } = useSignup();
  const {
    control,
    handleSubmit: submitForm,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      nome: '',
      email: '',
      cpf: '',
      senha: '',
      confirmarSenha: '',
      tipo: 'cidadao',
      numeroMatricula: '',
    },
  });

  const tipo = watch('tipo');
  const cpfValue = watch('cpf');
  const senha = watch('senha');
  const confirmarSenha = watch('confirmarSenha');
  const isCpfValid = !errors.cpf && cpfValue?.replace(/\D/g, '').length === 11;
  const passwordsMismatch = Boolean(confirmarSenha) && senha !== confirmarSenha;

  const onSubmit = async (data: SignupFormData): Promise<void> => {
    const success = await handleSubmit(data);

    if (success) {
      router.replace('/signup-confirmation');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandHeader}>
          <View style={styles.logoMark}>
            <Image
              source={require('@/assets/images/vetor-risco-logo.png')}
              contentFit="contain"
              style={styles.logoImage}
            />
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandName}>VetorRisco</Text>
            <View style={styles.cityBadge}>
              <Text style={styles.cityBadgeText}>RECIFE</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Crie sua conta</Text>

          <Controller
            control={control}
            name="tipo"
            render={({ field: { onChange, value } }) => (
              <View style={styles.segmentedControl}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onChange('cidadao')}
                  style={[styles.segment, value === 'cidadao' && styles.segmentActive]}>
                  <Text style={[styles.segmentText, value === 'cidadao' && styles.segmentTextActive]}>
                    Usuário Normal
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onChange('agente')}
                  style={[styles.segment, value === 'agente' && styles.segmentActive]}>
                  <Text style={[styles.segmentText, value === 'agente' && styles.segmentTextActive]}>
                    Servidor Público
                  </Text>
                </Pressable>
              </View>
            )}
          />

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nome completo</Text>
              <View style={styles.inputWrapper}>
                <Controller
                  control={control}
                  name="nome"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="José Maria dos Santos"
                      placeholderTextColor={colors.placeholder}
                      style={styles.input}
                    />
                  )}
                />
              </View>
              {errors.nome?.message ? <Text style={styles.errorText}>{errors.nome.message}</Text> : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="josemaria@gmail.com"
                      placeholderTextColor={colors.placeholder}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={styles.input}
                    />
                  )}
                />
              </View>
              {errors.email?.message ? <Text style={styles.errorText}>{errors.email.message}</Text> : null}
            </View>

            {tipo === 'agente' ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Número de matrícula</Text>
                <View style={styles.inputWrapper}>
                  <Controller
                    control={control}
                    name="numeroMatricula"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="000000"
                        placeholderTextColor={colors.placeholder}
                        keyboardType="numeric"
                        style={styles.input}
                      />
                    )}
                  />
                </View>
                {errors.numeroMatricula?.message ? (
                  <Text style={styles.errorText}>{errors.numeroMatricula.message}</Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>CPF</Text>
                {isCpfValid ? <Text style={styles.validText}>cpf válido</Text> : null}
              </View>
              <View style={styles.inputWrapper}>
                <Controller
                  control={control}
                  name="cpf"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value}
                      onBlur={onBlur}
                      onChangeText={(inputValue) => onChange(formatCpf(inputValue))}
                      placeholder="000.000.000-00"
                      placeholderTextColor={colors.placeholder}
                      keyboardType="numeric"
                      maxLength={14}
                      style={styles.input}
                    />
                  )}
                />
              </View>
              {errors.cpf?.message ? <Text style={styles.errorText}>{errors.cpf.message}</Text> : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Criar senha</Text>
              <View style={[styles.inputWrapper, errors.senha && styles.inputWrapperError]}>
                <Controller
                  control={control}
                  name="senha"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="••••••••••"
                      placeholderTextColor={colors.placeholder}
                      secureTextEntry={!isPasswordVisible}
                      style={styles.input}
                    />
                  )}
                />
                <Pressable
                  accessibilityLabel={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => setIsPasswordVisible((visible) => !visible)}>
                  <MaterialIcons
                    name={isPasswordVisible ? 'visibility' : 'visibility-off'}
                    size={21}
                    color={colors.icon}
                  />
                </Pressable>
              </View>
              {errors.senha?.message ? <Text style={styles.errorText}>{errors.senha.message}</Text> : null}
              <Text style={styles.helperText}>*Letras, números e símbolos</Text>
              <Text style={styles.helperText}>*Mínimo de 6 caracteres</Text>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>Confirmar senha</Text>
                {passwordsMismatch ? <Text style={styles.errorText}>as senhas não são iguais</Text> : null}
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  (errors.confirmarSenha || passwordsMismatch) && styles.inputWrapperError,
                ]}>
                <Controller
                  control={control}
                  name="confirmarSenha"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="••••••••••"
                      placeholderTextColor={colors.placeholder}
                      secureTextEntry={!isConfirmVisible}
                      style={styles.input}
                    />
                  )}
                />
                <Pressable
                  accessibilityLabel={isConfirmVisible ? 'Ocultar senha' : 'Mostrar senha'}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => setIsConfirmVisible((visible) => !visible)}>
                  <MaterialIcons
                    name={isConfirmVisible ? 'visibility' : 'visibility-off'}
                    size={21}
                    color={colors.icon}
                  />
                </Pressable>
              </View>
              {errors.confirmarSenha?.message && !passwordsMismatch ? (
                <Text style={styles.errorText}>{errors.confirmarSenha.message}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.actions}>
            {signupError ? <Text style={styles.formError}>{signupError}</Text> : null}
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={submitForm(onSubmit)}
              style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}>
              <Text style={styles.primaryButtonText}>{isSubmitting ? 'Cadastrando...' : 'Cadastrar'}</Text>
            </Pressable>

            <Text style={styles.termsText}>
              Ao clicar em cadastrar, você concorda com os nossos{' '}
              <Text style={styles.termsHighlight}>Termos de Serviço</Text> e com a{' '}
              <Text style={styles.termsHighlight}>Política de Privacidade</Text>
            </Text>

            <Pressable accessibilityRole="button" onPress={() => router.replace('/login')}>
              <Text style={styles.loginLink}>Possuo cadastro{'>'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  placeholder: '#A1A9B5',
  icon: '#7C8798',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.appBackground,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 32,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoMark: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    marginBottom: 10,
  },
  logoImage: {
    width: 48,
    height: 58,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    color: AppColors.securityBlue,
    fontSize: 21,
    fontWeight: '800',
  },
  cityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#EEF3FF',
  },
  cityBadgeText: {
    color: AppColors.securityBlue,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    color: AppColors.primaryText,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.inactive,
    backgroundColor: AppColors.surface,
  },
  segmentActive: {
    borderColor: AppColors.safe,
    backgroundColor: AppColors.safe,
  },
  segmentText: {
    color: AppColors.secondaryText,
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: AppColors.surface,
  },
  form: {
    gap: 18,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    color: AppColors.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  validText: {
    color: AppColors.safe,
    fontSize: 12,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    borderWidth: 1,
    borderColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: AppColors.inactive,
  },
  inputWrapperError: {
    borderWidth: 1,
    borderColor: AppColors.highRisk,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  input: {
    flex: 1,
    minHeight: 38,
    paddingVertical: 0,
    color: AppColors.secondaryText,
    fontSize: 14,
  },
  errorText: {
    color: AppColors.highRisk,
    fontSize: 12,
    fontWeight: '600',
  },
  helperText: {
    color: AppColors.primaryText,
    fontSize: 11,
    fontWeight: '600',
  },
  actions: {
    gap: 14,
    marginTop: 26,
    alignItems: 'center',
  },
  formError: {
    color: AppColors.highRisk,
    fontSize: 13,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: AppColors.securityBlue,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: AppColors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  termsText: {
    color: AppColors.secondaryText,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  termsHighlight: {
    color: AppColors.primaryText,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  loginLink: {
    color: AppColors.primaryText,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
