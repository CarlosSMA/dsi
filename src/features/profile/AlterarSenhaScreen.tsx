import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';

import { AppAlert } from '@/components/app-alert';
import { translateFirebaseError } from '@/src/services/auth-service';
import { alterarSenha } from '@/src/services/usuario-service';
import type { Usuario } from '@/src/types';

import { alterarSenhaSchema, type AlterarSenhaFormData } from './alterarSenhaSchema';
import {
  Field,
  FormCard,
  PasswordInput,
  PrimaryButton,
  ProfileCard,
  ProfileFormScreen,
} from './components/ProfileFormParts';

const fieldOrder: (keyof AlterarSenhaFormData)[] = ['senhaAtual', 'novaSenha', 'confirmarSenha'];

type AlertState = { variant: 'error' | 'success'; title: string; messages: string[] } | null;

// Mensagens específicas desta tela; o resto usa as traduções gerais do login.
function mensagemDeErro(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? (error as { code: string }).code : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'A senha atual está incorreta.';
    case 'auth/requires-recent-login':
      return 'Por segurança, saia e entre novamente na conta antes de alterar a senha.';
    default:
      return translateFirebaseError(error);
  }
}

interface AlterarSenhaScreenProps {
  usuario: Usuario;
}

export function AlterarSenhaScreen({ usuario }: AlterarSenhaScreenProps) {
  const router = useRouter();
  const [focusedField, setFocusedField] = useState<keyof AlterarSenhaFormData | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AlterarSenhaFormData>({
    resolver: zodResolver(alterarSenhaSchema),
    defaultValues: { senhaAtual: '', novaSenha: '', confirmarSenha: '' },
  });

  const onInvalid = (formErrors: FieldErrors<AlterarSenhaFormData>) => {
    const messages = fieldOrder
      .map((field) => formErrors[field]?.message)
      .filter((message): message is string => Boolean(message));
    setAlert({ variant: 'error', title: 'Verifique as senhas', messages });
  };

  const onSubmit = async (data: AlterarSenhaFormData) => {
    try {
      await alterarSenha(data.senhaAtual, data.novaSenha);
      reset();
      setAlert({
        variant: 'success',
        title: 'Senha atualizada',
        messages: ['Use a nova senha no próximo acesso.'],
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setAlert({ variant: 'error', title: 'Não foi possível alterar a senha', messages: [mensagemDeErro(error)] });
    }
  };

  const fechaAlerta = () => {
    const sucesso = alert?.variant === 'success';
    setAlert(null);
    // Depois de trocar a senha, volta para Meus Dados Cadastrais.
    if (sucesso) router.back();
  };

  const fieldEvents = (field: keyof AlterarSenhaFormData, onBlur: () => void) => ({
    onFocus: () => setFocusedField(field),
    onBlur: () => {
      onBlur();
      setFocusedField(null);
    },
    focused: focusedField === field,
    invalid: Boolean(errors[field]),
  });

  return (
    <ProfileFormScreen
      backLabel="Meus dados"
      title="Alterar Senha"
      subtitle="Por segurança, confirme sua senha atual antes de definir a nova senha de acesso.">
      <ProfileCard usuario={usuario} />

      <FormCard icon="lock" title="Segurança da Conta">
        <Field label="Senha Atual">
          <Controller
            control={control}
            name="senhaAtual"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordInput
                value={value}
                onChangeText={onChange}
                placeholder="••••••••••"
                textContentType="password"
                autoComplete="current-password"
                {...fieldEvents('senhaAtual', onBlur)}
              />
            )}
          />
        </Field>

        <Field label="Nova Senha" helper="Use letras, números e símbolos, com no mínimo 6 caracteres.">
          <Controller
            control={control}
            name="novaSenha"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordInput
                value={value}
                onChangeText={onChange}
                placeholder="••••••••••"
                textContentType="newPassword"
                autoComplete="new-password"
                {...fieldEvents('novaSenha', onBlur)}
              />
            )}
          />
        </Field>

        <Field label="Confirmar Nova Senha">
          <Controller
            control={control}
            name="confirmarSenha"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordInput
                value={value}
                onChangeText={onChange}
                placeholder="••••••••••"
                textContentType="newPassword"
                autoComplete="new-password"
                {...fieldEvents('confirmarSenha', onBlur)}
              />
            )}
          />
        </Field>
      </FormCard>

      <PrimaryButton
        icon="lock-reset"
        label={isSubmitting ? 'Atualizando...' : 'Atualizar Senha'}
        disabled={isSubmitting}
        onPress={handleSubmit(onSubmit, onInvalid)}
      />

      <AppAlert
        visible={alert !== null}
        variant={alert?.variant}
        title={alert?.title ?? ''}
        messages={alert?.messages ?? []}
        onClose={fechaAlerta}
      />
    </ProfileFormScreen>
  );
}
