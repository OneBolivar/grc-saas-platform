import prisma from '@/lib/prisma';
import { comparePassword } from '@/lib/password';
import { signToken } from '@/lib/jwt';
import { LoginInput, LoginResult } from '@/types/auth.types';

/**
 * Autentica un usuario contra el schema public y emite un JWT firmado.
 */
export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { tenant: true },
  });

  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Credenciales inválidas');
  }

  const token = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenant.id,
    tenantSlug: user.tenant.slug,
    schemaName: user.tenant.schemaName,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantName: user.tenant.name,
      tenantSlug: user.tenant.slug,
    },
  };
}