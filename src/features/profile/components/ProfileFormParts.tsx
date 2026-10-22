import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, Fonts } from '@/constants/theme';
import type { Usuario } from '@/src/types';

// Peças compartilhadas pelas telas de formulário do perfil (Meus Dados Cadastrais e Alterar Senha).

type IconName = keyof typeof MaterialIcons.glyphMap;

// Verde de confirmação usado no cadastro (selo de CPF válido e perfil Cidadão).
export const GREEN = '#059669';

export function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return initials || 'U';
}

interface ProfileFormScreenProps {
  backLabel: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function ProfileFormScreen({ backLabel, title, subtitle, children }: ProfileFormScreenProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Image source={require('@/assets/images/vetor-risco-logo.png')} contentFit="contain" style={styles.logo} />
        <View style={styles.brandBlock}>
          <Text style={styles.brandName}>VetorRisco</Text>
          <Text style={styles.city}>RECIFE</Text>
        </View>
        <Pressable
          accessibilityLabel="Abrir notificações"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.push('/notifications')}>
          <MaterialIcons name="notifications-none" size={24} color={AppColors.primaryText} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Pressable
            accessibilityLabel={`Voltar para ${backLabel}`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.back()}
            style={styles.backLink}>
            <MaterialIcons name="arrow-back" size={18} color={AppColors.actionBlue} />
            <Text style={styles.backLabel}>{backLabel}</Text>
          </Pressable>

          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Link dentro do formulário (ex.: "Alterar senha"), com uma linha separando do campo acima.
export function LinkRow({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.linkRow}>
      <MaterialIcons name={icon} size={16} color={AppColors.actionBlue} />
      <Text style={styles.linkLabel}>{label}</Text>
      <MaterialIcons name="chevron-right" size={20} color={AppColors.actionBlue} />
    </Pressable>
  );
}

export function ProfileCard({ usuario }: { usuario: Usuario }) {
  const roleLabel = usuario.role === 'agente' ? 'Agente Municipal' : 'Cidadão Colaborador';

  return (
    <View style={styles.profileCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarLabel}>{getInitials(usuario.nome)}</Text>
      </View>
      <View style={styles.profileCopy}>
        <Text numberOfLines={1} style={styles.profileName}>
          {usuario.nome}
        </Text>
        <View style={styles.greenBadge}>
          <MaterialIcons name="verified" size={11} color={GREEN} />
          <Text style={styles.greenBadgeLabel}>
            {roleLabel}
            {usuario.role === 'agente' && usuario.numero_matricula ? ` • Matrícula ${usuario.numero_matricula}` : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function FormCard({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <View style={styles.formCard}>
      <View style={styles.sectionTitleRow}>
        <MaterialIcons name={icon} size={18} color={AppColors.actionBlue} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

interface FieldProps {
  label: string;
  badge?: ReactNode;
  helper?: string;
  helperIcon?: IconName;
  children: ReactNode;
}

export function Field({ label, badge, helper, helperIcon, children }: FieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {badge}
      </View>
      {children}
      {helper ? (
        <View style={styles.helperRow}>
          {helperIcon ? <MaterialIcons name={helperIcon} size={13} color={AppColors.actionBlue} /> : null}
          <Text style={styles.helper}>{helper}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function GreenTag({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={styles.greenTag}>
      <MaterialIcons name={icon} size={11} color={GREEN} />
      <Text style={styles.greenTagLabel}>{label}</Text>
    </View>
  );
}

export function LockedValue({ value }: { value: string }) {
  return (
    <View style={[styles.input, styles.inputLocked]}>
      <Text numberOfLines={1} style={styles.lockedText}>
        {value}
      </Text>
      <MaterialIcons name="lock" size={16} color={AppColors.secondaryText} />
    </View>
  );
}

interface InputProps extends TextInputProps {
  focused: boolean;
  invalid: boolean;
}

export function Input({ focused, invalid, style, ...props }: InputProps) {
  return (
    <TextInput
      placeholderTextColor="#94A3B8"
      style={[styles.input, styles.inputText, focused && styles.inputFocused, invalid && styles.inputInvalid, style]}
      {...props}
    />
  );
}

// Campo de senha com o botão de mostrar/ocultar.
export function PasswordInput({ focused, invalid, ...props }: InputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.input, focused && styles.inputFocused, invalid && styles.inputInvalid]}>
      <TextInput
        placeholderTextColor="#94A3B8"
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.inputText, styles.passwordText]}
        {...props}
      />
      <Pressable
        accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => setVisible((current) => !current)}>
        <MaterialIcons name={visible ? 'visibility' : 'visibility-off'} size={20} color={AppColors.secondaryText} />
      </Pressable>
    </View>
  );
}

interface PrimaryButtonProps {
  icon: IconName;
  label: string;
  disabled?: boolean;
  onPress: () => void;
}

export function PrimaryButton({ icon, label, disabled = false, onPress }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]}>
      <MaterialIcons name={icon} size={18} color={AppColors.surface} />
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  header: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: AppColors.surface,
  },
  logo: {
    width: 30,
    height: 38,
    marginRight: 6,
  },
  brandBlock: {
    flex: 1,
  },
  brandName: {
    color: AppColors.primaryText,
    fontFamily: Fonts?.sans,
    fontSize: 17,
    fontWeight: '700',
  },
  city: {
    color: AppColors.actionBlue,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 10,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  },
  backLabel: {
    color: AppColors.actionBlue,
    fontSize: 14,
    fontWeight: '600',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  linkLabel: {
    flex: 1,
    color: AppColors.actionBlue,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    color: AppColors.primaryText,
    fontFamily: Fonts?.sans,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 4,
    color: AppColors.secondaryText,
    fontSize: 12,
    lineHeight: 17,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatar: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
    backgroundColor: '#DBEAFE',
  },
  avatarLabel: {
    color: AppColors.securityBlue,
    fontSize: 19,
    fontWeight: '800',
  },
  profileCopy: {
    flex: 1,
    gap: 5,
  },
  profileName: {
    color: AppColors.primaryText,
    fontSize: 17,
    fontWeight: '700',
  },
  greenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#ECFDF5',
  },
  greenBadgeLabel: {
    color: GREEN,
    fontSize: 11,
  },
  formCard: {
    gap: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: AppColors.primaryText,
    fontSize: 17,
    fontWeight: '700',
  },
  field: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: AppColors.secondaryText,
    fontSize: 12,
    fontWeight: '600',
  },
  greenTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#ECFDF5',
  },
  greenTagLabel: {
    color: GREEN,
    fontSize: 10,
    fontWeight: '600',
  },
  input: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    backgroundColor: '#F8F7FF',
  },
  inputText: {
    color: AppColors.primaryText,
    fontSize: 15,
    fontWeight: '500',
  },
  passwordText: {
    flex: 1,
    minHeight: 40,
  },
  inputFocused: {
    borderColor: AppColors.actionBlue,
    backgroundColor: AppColors.surface,
  },
  inputInvalid: {
    borderColor: AppColors.highRisk,
  },
  inputLocked: {
    backgroundColor: '#EEF2FF',
  },
  lockedText: {
    flex: 1,
    color: AppColors.secondaryText,
    fontSize: 15,
    fontWeight: '500',
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  helper: {
    flex: 1,
    color: AppColors.secondaryText,
    fontSize: 11,
    lineHeight: 15,
  },
  primaryButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 26,
    backgroundColor: AppColors.actionBlue,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: AppColors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});
