import { z } from 'zod';

import { isValidCpf } from './utils/cpf';

export const loginSchema = z.object({
	cpf: z
		.string()
		.min(1, 'Informe o CPF')
		.refine(isValidCpf, 'Informe um CPF válido'),
	senha: z.string().min(1, 'Informe a senha'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
