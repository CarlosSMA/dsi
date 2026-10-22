import { z } from 'zod';

import { parseBrDate, phoneDigits } from './utils/dados-cadastrais';

const MAX_AGE = 120;

export const meusDadosSchema = z.object({
  nome: z.string().trim().min(3, 'Informe seu nome completo').max(100, 'O nome pode ter até 100 caracteres'),
  dataNascimento: z
    .string()
    .refine((value) => value === '' || parseBrDate(value) !== null, 'Informe uma data de nascimento válida (DD/MM/AAAA)')
    .refine((value) => {
      const date = parseBrDate(value);
      if (!date) return true;
      const today = new Date();
      const oldest = new Date(today.getFullYear() - MAX_AGE, today.getMonth(), today.getDate());
      return date <= today && date >= oldest;
    }, 'Informe uma data de nascimento real, que não esteja no futuro'),
  telefone: z
    .string()
    .refine((value) => {
      const digits = phoneDigits(value);
      return digits.length === 0 || digits.length === 10 || digits.length === 11;
    }, 'Informe o celular com DDD, por exemplo (81) 98765-4321'),
});

export type MeusDadosFormData = z.infer<typeof meusDadosSchema>;
