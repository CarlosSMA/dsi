import { useState } from 'react';

import type { LoginFormData } from './schema';

type LoginResult = {
  success: boolean;
  message?: string;
};

async function loginMock(cpf: string, senha: string): Promise<LoginResult> {
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
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit({ cpf, senha }: LoginFormData): Promise<boolean> {
    setError(null);

    const result = await loginMock(cpf, senha);

    if (!result.success) {
      setError(result.message ?? 'Não foi possível entrar.');
      return false;
    }

    return true;
  }

  return { error, handleSubmit };
}
