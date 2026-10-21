import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';

import { AppAlert } from '@/components/app-alert';
import { useAuth } from '@/src/contexts/auth-context';
import { auth } from '@/src/services/firebase';
import { atualizarDadosCadastrais } from '@/src/services/usuario-service';
import type { Usuario } from '@/src/types';

import {
  Field,
  FormCard,
  GreenTag,
  Input,
  LinkRow,
  LockedValue,
  PrimaryButton,
  ProfileCard,
  ProfileFormScreen,
} from './components/ProfileFormParts';
import { meusDadosSchema, type MeusDadosFormData } from './meusDadosSchema';
import {
  brToIsoDate,
  formatDateInput,
  formatPhoneInput,
  isoToBrDate,
  maskCpf,
  phoneDigits,
} from './utils/dados-cadastrais';

const fieldOrder: (keyof MeusDadosFormData)[] = ['nome', 'dataNascimento', 'telefone'];

type AlertState = { variant: 'error' | 'success'; title: string; messages: string[] } | null;

interface MeusDadosScreenProps {
  usuario: Usuario;
}

export function MeusDadosScreen({ usuario }: MeusDadosScreenProps) {
  const router = useRouter();
  const { atualizarUsuario } = useAuth();
  const [focusedField, setFocusedField] = useState<keyof MeusDadosFormData | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);
  const emailVerificado = auth.currentUser?.emailVerified ?? false;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<MeusDadosFormData>({
    resolver: zodResolver(meusDadosSchema),
    defaultValues: {
      nome: usuario.nome,
      dataNascimento: isoToBrDate(usuario.dataNascimento),
      telefone: formatPhoneInput(usuario.telefone ?? ''),
    },
  });

  const onInvalid = (formErrors: FieldErrors<MeusDadosFormData>) => {
    const messages = fieldOrder
      .map((field) => formErrors[field]?.message)
      .filter((message): message is string => Boolean(message));
    setAlert({ variant: 'error', title: 'Verifique os dados', messages });
  };

  const onSubmit = async (data: MeusDadosFormData) => {
    const dados = {
      nome: data.nome.trim(),
      dataNascimento: brToIsoDate(data.dataNascimento),
      telefone: phoneDigits(data.telefone),
    };

    try {
      await atualizarDadosCadastrais(usuario.id, dados);
      atualizarUsuario(dados);
      reset({ nome: dados.nome, dataNascimento: data.dataNascimento, telefone: data.telefone });
      setAlert({ variant: 'success', title: 'Dados atualizados', messages: ['Suas alterações foram salvas.'] });
    } catch (error) {
      console.error('Erro ao salvar dados cadastrais:', error);
      setAlert({
        variant: 'error',
        title: 'Não foi possível salvar',
        messages: ['Verifique sua conexão e tente novamente.'],
      });
    }
  };

  const fieldEvents = (field: keyof MeusDadosFormData, onBlur: () => void) => ({
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
      backLabel="Perfil"
      title="Meus Dados Cadastrais"
      subtitle="Mantenha seu registro atualizado para apoio às ações de vigilância.">
      <ProfileCard usuario={usuario} />

      <FormCard icon="badge" title="Identificação Pessoal">
        <Field label="Nome Completo">
          <Controller
            control={control}
            name="nome"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input value={value} onChangeText={onChange} autoCapitalize="words" {...fieldEvents('nome', onBlur)} />
            )}
          />
        </Field>

        <Field
          label="CPF"
          badge={<GreenTag icon="lock-outline" label="Protegido por LGPD" />}
          helper="O CPF não pode ser alterado.">
          <LockedValue value={maskCpf(usuario.cpf ?? '') || 'Não informado'} />
        </Field>

        <Field label="Data de Nascimento">
          <Controller
            control={control}
            name="dataNascimento"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={value}
                onChangeText={(text) => onChange(formatDateInput(text))}
                placeholder="DD/MM/AAAA"
                keyboardType="number-pad"
                maxLength={10}
                {...fieldEvents('dataNascimento', onBlur)}
              />
            )}
          />
        </Field>

        <Field
          label="E-mail Cadastrado"
          badge={emailVerificado ? <GreenTag icon="check-circle" label="Verificado" /> : undefined}>
          <LockedValue value={usuario.email || 'Não informado'} />
        </Field>

        <Field
          label="Celular / WhatsApp"
          helper="Utilizado exclusivamente para confirmação rápida e agendamento de vistorias técnicas."
          helperIcon="info-outline">
          <Controller
            control={control}
            name="telefone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={value}
                onChangeText={(text) => onChange(formatPhoneInput(text))}
                placeholder="(81) 98765-4321"
                keyboardType="phone-pad"
                maxLength={15}
                {...fieldEvents('telefone', onBlur)}
              />
            )}
          />
        </Field>

        <LinkRow icon="lock-outline" label="Alterar senha" onPress={() => router.push('/alterar-senha')} />
      </FormCard>

      <PrimaryButton
        icon="save"
        label={isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        disabled={!isDirty || isSubmitting}
        onPress={handleSubmit(onSubmit, onInvalid)}
      />

      <AppAlert
        visible={alert !== null}
        variant={alert?.variant}
        title={alert?.title ?? ''}
        messages={alert?.messages ?? []}
        onClose={() => setAlert(null)}
      />
    </ProfileFormScreen>
  );
}
