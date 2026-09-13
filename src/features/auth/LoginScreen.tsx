import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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

import { formatCpf } from './utils/cpf';
import { loginSchema, type LoginFormData } from './schema';
import { useLogin } from './useLogin';

export function LoginScreen() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { error: loginError, handleSubmit } = useLogin();
  const {
    control,
    handleSubmit: submitForm,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { cpf: '', senha: '' },
  });

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    await handleSubmit(data);
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

        <View style={styles.intro}>
          <Text style={styles.title}>Entrar na sua conta</Text>
          <Text style={styles.description}>
            Acompanhe o nivel de risco do seu bairro e reporte focos de mosquitos.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>CPF</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="badge" size={20} color={colors.icon} />
              <Controller
                control={control}
                name="cpf"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onBlur={onBlur}
                    onChangeText={(inputValue) => onChange(formatCpf(inputValue))}
                    placeholder="CPF"
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
            <View style={styles.passwordLabelRow}>
              <Text style={styles.fieldLabel}>Senha</Text>
              <Pressable accessibilityRole="button" onPress={() => undefined}>
                <Text style={styles.forgotPassword}>Esqueci minha senha</Text>
              </Pressable>
            </View>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock-outline" size={20} color={colors.icon} />
              <Controller
                control={control}
                name="senha"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Senha"
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
          </View>
        </View>

        <View style={styles.actions}>
          {loginError ? <Text style={styles.formError}>{loginError}</Text> : null}
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={submitForm(onSubmit)}
            style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}>
            <Text style={styles.primaryButtonText}>{isSubmitting ? 'Entrando...' : 'Entrar'}</Text>
            {!isSubmitting ? <MaterialIcons name="arrow-forward" size={21} color="#FFFFFF" /> : null}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerLabel}>OU</Text>
            <View style={styles.divider} />
          </View>

          <Pressable accessibilityRole="button" onPress={() => undefined} style={styles.secondaryButton}>
            <MaterialIcons name="person-add-alt-1" size={19} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Criar nova conta</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerBrandRow}>
            <Text style={styles.susMark}>SUS</Text>
            <Text style={styles.footerSeparator}>•</Text>
            <Text style={styles.footerText}>Prefeitura do Recife</Text>
          </View>
          <Text style={styles.footerCaption}>Iniciativa de apoio a Saude Publica de Recife</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  primary: '#2167E8',
  navy: '#203D7D',
  ink: '#182234',
  muted: '#667080',
  icon: '#7C8798',
  placeholder: '#A1A9B5',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 36,
    paddingTop: 48,
    paddingBottom: 24,
  },
  brandHeader: {
    marginBottom: 76,
  },
  logoMark: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    marginBottom: 14,
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
    color: colors.navy,
    fontSize: 23,
    fontWeight: '800',
  },
  cityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#EEF3FF',
  },
  cityBadgeText: {
    color: colors.navy,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  intro: {
    gap: 8,
  },
  title: {
    color: colors.ink,
    fontSize: 25,
    fontWeight: '800',
  },
  description: {
    maxWidth: 310,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 20,
    marginTop: 42,
    marginBottom: 34,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '500',
  },
  passwordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  forgotPassword: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E0E4EA',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#1B2B4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  input: {
    flex: 1,
    minHeight: 46,
    marginLeft: 10,
    paddingVertical: 0,
    color: colors.ink,
    fontSize: 14,
  },
  errorText: {
    color: '#C43D4B',
    fontSize: 12,
  },
  actions: {
    gap: 16,
    marginBottom: 48,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    gap: 10,
    borderRadius: 15,
    backgroundColor: colors.primary,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  formError: {
    color: '#C43D4B',
    fontSize: 13,
    textAlign: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E4EA',
  },
  dividerLabel: {
    color: '#7D8796',
    fontSize: 12,
    fontWeight: '500',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    gap: 9,
    borderWidth: 1,
    borderColor: '#E0E4EA',
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    gap: 7,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  susMark: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  footerSeparator: {
    color: '#AAB3C2',
    fontSize: 12,
  },
  footerText: {
    color: '#596273',
    fontSize: 12,
  },
  footerCaption: {
    color: '#8B94A3',
    fontSize: 10,
  },
});

