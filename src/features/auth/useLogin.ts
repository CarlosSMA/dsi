import { useState } from 'react';

import { useAuth } from '@/src/contexts/AuthContext';

import type { LoginFormData } from './schema';

type LoginResult = {
  success: boolean;
  message?: string;
};

async function login(cpf: string, senha: string): Promise<LoginResult> {
  await new Promise<void>((resolve) => setTimeout(resolve, 800));

  if (senha === 'erro') {
    return { success: false, message: 'CPF ou senha inválidos.' };
  }

  return {
    success: true,
    message: `Login mockado para ${cpf.replace(/\D/g, '')}`,
  };
}

export function useLogin() {
  const { login: setAuthenticatedUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit({ cpf, senha }: LoginFormData): Promise<boolean> {
    setError(null);

    const result = await login(cpf, senha);

    if (!result.success) {
      setError(result.message ?? 'Não foi possível entrar.');
      return false;
    }

    setAuthenticatedUser({
      id: cpf.replace(/\D/g, ''),
      name: 'Usuário VetorRisco',
    });

    return true;
  }

  return { error, handleSubmit };
}
