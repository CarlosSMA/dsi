import { useState } from 'react';

import { registerUser, translateFirebaseError } from '@/src/services/auth-service';

import type { SignupFormData } from './signupSchema';

export function useSignup() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: SignupFormData): Promise<boolean> {
    setError(null);

    try {
      await registerUser({
        nome: data.nome,
        email: data.email,
        cpf: data.cpf,
        senha: data.senha,
        tipo: data.tipo,
        numeroMatricula: data.numeroMatricula,
      });
      return true;
    } catch (err) {
      const errorMessage = translateFirebaseError(err);
      setError(errorMessage);
      return false;
    }
  }

  return { error, handleSubmit };
}
