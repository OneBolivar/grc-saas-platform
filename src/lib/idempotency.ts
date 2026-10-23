import prisma from '@/lib/prisma';
import {
  IdempotencyCheckResult,
  SaveIdempotencyInput,
} from '@/types/idempotency.types';

const DEFAULT_TTL_HOURS = 24;

/**
 * Consulta si una clave de idempotencia ya fue procesada y continúa vigente.
 */
export async function getIdempotentResponse(
  key: string
): Promise<IdempotencyCheckResult> {
  const existingRecord = await prisma.idempotencyKey.findUnique({
    where: { key },
  });

  if (!existingRecord) {
    return { isCached: false };
  }

  const now = new Date();
  if (existingRecord.expiresAt < now) {
    // Si la clave caducó, se descarta para permitir un nuevo procesamiento
    await prisma.idempotencyKey.delete({ where: { key } });
    return { isCached: false };
  }

  return {
    isCached: true,
    statusCode: existingRecord.statusCode,
    responseBody: existingRecord.responseBody,
  };
}

/**
 * Almacena el código de respuesta y el JSON resultante asociado a la clave de idempotencia.
 */
export async function saveIdempotentResponse(
  input: SaveIdempotencyInput
): Promise<void> {
  const { key, statusCode, responseBody, ttlHours = DEFAULT_TTL_HOURS } = input;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

  // Serializar el cuerpo a un objeto compatible con Json en Prisma
  const bodyToSave =
    typeof responseBody === 'object' && responseBody !== null
      ? (responseBody as object)
      : { data: responseBody };

  await prisma.idempotencyKey.create({
    data: {
      key,
      statusCode,
      responseBody: bodyToSave,
      expiresAt,
    },
  });
}