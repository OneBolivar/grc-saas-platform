export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
  tenantSlug: string;
  schemaName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  tenantName: string;
  tenantSlug: string;
}

export interface LoginResult {
  token: string;
  user: AuthenticatedUser;
}