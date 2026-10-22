import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z
    .string()
    .min(3, 'El nombre de la empresa debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede superar los 100 caracteres'),
  slug: z
    .string()
    .min(3, 'El identificador (slug) debe tener al menos 3 caracteres')
    .max(50, 'El slug no puede superar los 50 caracteres')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  adminEmail: z
    .string()
    .email('Debe ser un correo electrónico válido'),
  adminPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede superar los 100 caracteres'),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;