import { z } from 'zod';

import { isValidPassword } from '@/src/features/auth/utils/password';

export const alterarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Informe a senha atual'),
    novaSenha: z
      .string()
      .min(1, 'Informe a nova senha')
      .refine((value) => value === '' || isValidPassword(value), 'A nova senha precisa de letras, números e símbolos (mínimo 6 caracteres)'),
    confirmarSenha: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    message: 'As senhas não são iguais',
    path: ['confirmarSenha'],
  })
  .refine((data) => !data.novaSenha || data.novaSenha !== data.senhaAtual, {
    message: 'A nova senha precisa ser diferente da atual',
    path: ['novaSenha'],
  });

export type AlterarSenhaFormData = z.infer<typeof alterarSenhaSchema>;
