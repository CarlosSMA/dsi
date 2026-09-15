import { z } from 'zod';

import { isValidCpf } from './utils/cpf';
import { isValidPassword } from './utils/password';

export const signupSchema = z
  .object({
    nome: z.string().min(3, 'Informe seu nome completo'),
    email: z.string().min(1, 'Informe o email').email('Informe um email válido'),
    cpf: z
      .string()
      .min(1, 'Informe o CPF')
      .refine(isValidCpf, 'Informe um CPF válido'),
    senha: z
      .string()
      .min(1, 'Informe a senha')
      .refine(isValidPassword, 'A senha precisa de letras, números e símbolos (mínimo 6 caracteres)'),
    confirmarSenha: z.string().min(1, 'Confirme a senha'),
    tipo: z.enum(['cidadao', 'agente']),
    numeroMatricula: z.string().optional(),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: 'As senhas não são iguais',
    path: ['confirmarSenha'],
  })
  .refine((data) => data.tipo !== 'agente' || !!data.numeroMatricula?.trim(), {
    message: 'Informe o número de matrícula',
    path: ['numeroMatricula'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;
