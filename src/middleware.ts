import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

// Rutas protegidas que exigen autenticación
const PROTECTED_PREFIXES = ['/dashboard', '/api/grc'];

// Rutas de autenticación pública
const AUTH_ROUTES = ['/login'];

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);

  // 1. Verificar la validez del token si existe
  const payload = token ? await verifyToken(token) : null;
  const isAuthenticated = Boolean(payload);

  // Caso 1: Intenta entrar a una ruta protegida sin sesión válida
  if (isProtected && !isAuthenticated) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Caso 2: Usuario autenticado navega (o da 'Atrás') hacia /login
  // Lo redirigimos a su dashboard correspondiente sin destruir la sesión
  if (isAuthRoute && isAuthenticated && payload) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Caso 3: Petición autorizada. Inyectamos en las cabeceras internas el contexto del tenant
  const requestHeaders = new Headers(request.headers);
  if (payload) {
    requestHeaders.set('x-tenant-id', payload.tenantId);
    requestHeaders.set('x-tenant-slug', payload.tenantSlug);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-schema-name', payload.schemaName);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/api/grc/:path*'],
};