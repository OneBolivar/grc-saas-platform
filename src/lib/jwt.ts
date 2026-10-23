import { SignJWT, jwtVerify } from 'jose';
import { TokenPayload } from '@/types/auth.types';

const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_por_defecto_grc_2026_segura';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function signToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secretKey);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}