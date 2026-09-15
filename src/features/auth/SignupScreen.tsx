import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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

import { formatCpf, isValidCpf } from './utils/cpf';

type FormState = {
  nome: string;
  email: string;
  cpf: string;
  senha: string;
  confirmarSenha: string;
  tipo: 'cidadao' | 'agente';
  numeroMatricula: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialState: FormState = {
  nome: '',
  email: '',
  cpf: '',
  senha: '',
  confirmarSenha: '',
  tipo: 'cidadao',
  numeroMatricula: '',
};

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (form.nome.trim().length < 3) errors.nome = 'Informe seu nome completo';
  if (!form.email.includes('@')) errors.email = 'Informe um email válido';
  if (!isValidCpf(form.cpf)) errors.cpf = 'Informe um CPF válido';
  if (form.senha.length < 6) errors.senha = 'A senha precisa de no mínimo 6 caracteres';
  if (form.confirmarSenha !== form.senha) errors.confirmarSenha = 'As senhas não são iguais';
  if (form.tipo === 'agente' && !form.numeroMatricula.trim()) {
    errors.numeroMatricula = 'Informe o número de matrícula';
  }

  return errors;
}

export function SignupScreen() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const router = useRouter();

  const isCpfValid = isValidCpf(form.cpf);
  const passwordsMismatch = Boolean(form.confirmarSenha) && form.senha !== form.confirmarSenha;

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function onSubmit() {
    const validationErrors = validate(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    // TODO: integrar com o cadastro real no Firebase.
    console.log('Cadastro (stub):', form);
  }

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

          <View style={styles.segmentedControl}>
            <Pressable
              accessibilityRole="button"
              onPress={() => updateField('tipo', 'cidadao')}
              style={[styles.segment, form.tipo === 'cidadao' && styles.segmentActive]}>
              <Text style={[styles.segmentText, form.tipo === 'cidadao' && styles.segmentTextActive]}>
                Usuário Normal
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => updateField('tipo', 'agente')}
              style={[styles.segment, form.tipo === 'agente' && styles.segmentActive]}>
              <Text style={[styles.segmentText, form.tipo === 'agente' && styles.segmentTextActive]}>
                Servidor Público
              </Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nome completo</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={form.nome}
                  onChangeText={(value) => updateField('nome', value)}
                  placeholder="José Maria dos Santos"
                  placeholderTextColor={colors.placeholder}
                  style={styles.input}
                />
              </View>
              {errors.nome ? <Text style={styles.errorText}>{errors.nome}</Text> : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={form.email}
                  onChangeText={(value) => updateField('email', value)}
                  placeholder="josemaria@gmail.com"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            {form.tipo === 'agente' ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Número de matrícula</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={form.numeroMatricula}
                    onChangeText={(value) => updateField('numeroMatricula', value)}
                    placeholder="000000"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
                {errors.numeroMatricula ? (
                  <Text style={styles.errorText}>{errors.numeroMatricula}</Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>CPF</Text>
                {isCpfValid ? <Text style={styles.validText}>cpf válido</Text> : null}
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={form.cpf}
                  onChangeText={(value) => updateField('cpf', formatCpf(value))}
                  placeholder="000.000.000-00"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="numeric"
                  maxLength={14}
                  style={styles.input}
                />
              </View>
              {errors.cpf ? <Text style={styles.errorText}>{errors.cpf}</Text> : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Criar senha</Text>
              <View style={[styles.inputWrapper, errors.senha && styles.inputWrapperError]}>
                <TextInput
                  value={form.senha}
                  onChangeText={(value) => updateField('senha', value)}
                  placeholder="••••••••••"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry={!isPasswordVisible}
                  style={styles.input}
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
              {errors.senha ? <Text style={styles.errorText}>{errors.senha}</Text> : null}
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
                <TextInput
                  value={form.confirmarSenha}
                  onChangeText={(value) => updateField('confirmarSenha', value)}
                  placeholder="••••••••••"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry={!isConfirmVisible}
                  style={styles.input}
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
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onSubmit} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Cadastrar</Text>
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
  actions: {
    gap: 14,
    marginTop: 26,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: AppColors.securityBlue,
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
