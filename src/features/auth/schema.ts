import { z } from 'zod';

export const loginSchema = z.object({});

export type LoginFormData = z.infer<typeof loginSchema>;
