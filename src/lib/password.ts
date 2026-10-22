import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Transforma una contraseña en texto plano en un hash irreversible.
 */
export async function hashPassword(plainText: string): Promise<string> {
  return await bcrypt.hash(plainText, SALT_ROUNDS);
}

/**
 * Compara una contraseña ingresada con el hash guardado en la base de datos.
 */
export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(plainText, hash);
}