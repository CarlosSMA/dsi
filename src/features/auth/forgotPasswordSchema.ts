import { z } from 'zod';

import { isValidCpf } from './utils/cpf';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const forgotPasswordSchema = z.object({
  identificador: z
    .string()
    .min(1, 'Informe seu e-mail ou CPF')
    .refine((val) => {
      const trimmed = val.trim();
      if (emailRegex.test(trimmed)) {
        return true;
      }
      return isValidCpf(trimmed);
    }, 'Informe um e-mail válido ou um CPF válido'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
