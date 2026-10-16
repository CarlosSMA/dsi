import { useState } from 'react';

import {
  sendPasswordResetInstructions,
  translateFirebaseError,
} from '@/src/services/auth-service';

import type { ForgotPasswordFormData } from './forgotPasswordSchema';

export function useForgotPassword() {
  const [error, setError] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleResetPassword({ identificador }: ForgotPasswordFormData): Promise<boolean> {
    setError(null);

    try {
      const email = await sendPasswordResetInstructions(identificador);
      setSuccessEmail(email);
      setIsSuccess(true);
      return true;
    } catch (err) {
      const errorMessage = translateFirebaseError(err);
      setError(errorMessage);
      setIsSuccess(false);
      return false;
    }
  }

  function resetState() {
    setError(null);
    setSuccessEmail(null);
    setIsSuccess(false);
  }

  return {
    error,
    successEmail,
    isSuccess,
    handleResetPassword,
    resetState,
  };
}
