import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

/**
 * Ejecuta una operación de base de datos en el contexto aislado del schema del tenant.
 * El uso de SET LOCAL asegura que el search_path se restablezca al cerrar la transacción.
 */
export async function withTenantContext<T>(
  schemaName: string,
  operation: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  // Validar estrictamente el formato del schema para prevenir cualquier inyección
  if (!/^tenant_[a-z0-9_]+$/.test(schemaName)) {
    throw new Error(`Nombre de schema inválido o malformado: "${schemaName}"`);
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Fijar el search_path local a la transacción
    await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schemaName}", public;`);

    // 2. Ejecutar la operación de negocio aislada
    return await operation(tx);
  });
}