import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/schemas/auth.schema';
import { loginUser } from '@/services/auth.service';
import { checkRateLimit } from '@/lib/rate-limiter';
import { getErrorMessage } from '@/lib/errors';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const forwardedHeader = request.headers.get('x-forwarded-for');
    const clientIp = forwardedHeader ? forwardedHeader.split(',')[0].trim() : '127.0.0.1';
    const rateLimitKey = `login_${clientIp}`;

    // Rate Limiting: máximo 5 intentos por minuto
    const rateLimit = checkRateLimit(rateLimitKey, { limit: 5, windowMs: 60 * 1000 });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Demasiados intentos de autenticación. Por favor espere antes de reintentar.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimit.retryAfter.toString(),
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const body: unknown = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos de inicio de sesión inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { token, user } = await loginUser(validation.data);

    const response = NextResponse.json(
      {
        message: 'Sesión iniciada con éxito',
        user,
      },
      { status: 200 }
    );

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60, // 8 horas
    });

    return response;
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 401 });
  }
}