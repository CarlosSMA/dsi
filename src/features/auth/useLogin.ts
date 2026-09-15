import { useState } from 'react';

import { loginWithCpf, translateFirebaseError } from '@/src/services/auth-service';

import type { LoginFormData } from './schema';

export function useLogin() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit({ cpf, senha }: LoginFormData): Promise<boolean> {
    setError(null);

    try {
      await loginWithCpf(cpf, senha);
      return true;
    } catch (err) {
      const errorMessage = translateFirebaseError(err);
      setError(errorMessage);
      return false;
    }
  }

  return { error, handleSubmit };
}
