import { z } from 'zod';

// 1. Esquema para Riesgos (risks)
export const createRiskSchema = z.object({
  code: z
    .string()
    .min(3, 'El código debe tener al menos 3 caracteres (ej. RSK-01)')
    .max(50),
  title: z
    .string()
    .min(5, 'El título del riesgo debe tener al menos 5 caracteres')
    .max(255),
  description: z.string().optional(),
  severity: z.enum(['BAJO', 'MEDIO', 'ALTO', 'CRITICO'], {
    errorMap: () => ({ message: 'La severidad debe ser BAJO, MEDIO, ALTO o CRITICO' }),
  }),
  status: z
    .enum(['IDENTIFICADO', 'EN_TRATAMIENTO', 'MITIGADO'])
    .default('IDENTIFICADO'),
});

export type CreateRiskInput = z.infer<typeof createRiskSchema>;

// 2. Esquema para Controles Common Criteria (controls)
export const createControlSchema = z.object({
  code: z
    .string()
    .min(3, 'El código debe tener al menos 3 caracteres (ej. CC6.1)')
    .max(50),
  name: z
    .string()
    .min(5, 'El nombre del control debe tener al menos 5 caracteres')
    .max(255),
  description: z.string().optional(),
  type: z.enum(['PREVENTIVO', 'DETECTIVO', 'CORRECTIVO'], {
    errorMap: () => ({ message: 'El tipo debe ser PREVENTIVO, DETECTIVO o CORRECTIVO' }),
  }),
  periodicity: z.enum(['DIARIO', 'SEMANAL', 'MENSUAL', 'TRIMESTRAL', 'ANUAL'], {
    errorMap: () => ({ message: 'Periodicidad no válida' }),
  }),
  riskId: z.string().uuid('Debe ser un UUID válido del riesgo asociado').optional().nullable(),
});

export type CreateControlInput = z.infer<typeof createControlSchema>;

// 3. Esquema para Evaluaciones de Auditoría (audits)
export const createAuditSchema = z.object({
  auditCode: z
    .string()
    .min(3, 'El código de auditoría debe tener al menos 3 caracteres (ej. AUD-001)')
    .max(50),
  auditorName: z
    .string()
    .min(3, 'El nombre del auditor debe tener al menos 3 caracteres')
    .max(255),
  controlId: z.string().uuid('Debe seleccionar un control válido mediante su UUID'),
  complianceStatus: z.enum(['CONFORME', 'NO_CONFORME', 'OBSERVACION'], {
    errorMap: () => ({ message: 'El estado debe ser CONFORME, NO_CONFORME u OBSERVACION' }),
  }),
  findings: z
    .string()
    .min(5, 'Los hallazgos u observaciones deben tener al menos 5 caracteres'),
});

export type CreateAuditInput = z.infer<typeof createAuditSchema>;