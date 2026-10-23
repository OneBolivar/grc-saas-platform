import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .email('Debe ingresar un correo electrónico válido')
    .max(255),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .max(100),
});

export type LoginSchemaInput = z.infer<typeof loginSchema>;