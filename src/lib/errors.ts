/**
 * Extrae de forma segura el mensaje de un error capturado en un bloque try/catch.
 * Cumple con ESLint estricto evitando el uso de 'any'.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Ha ocurrido un error inesperado en el servidor';
}