import { NextRequest, NextResponse } from 'next/server';
import { createTenantSchema } from '@/schemas/tenant.schema';
import { createTenantWithSchema } from '@/services/tenant.service';
import { checkRateLimit } from '@/lib/rate-limiter';
import {
  getIdempotentResponse,
  saveIdempotentResponse,
} from '@/lib/idempotency';
import { getErrorMessage } from '@/lib/errors';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Rate Limiting: máximo 10 peticiones de aprovisionamiento por minuto
    const forwardedHeader = request.headers.get('x-forwarded-for');
    const clientIp = forwardedHeader ? forwardedHeader.split(',')[0].trim() : '127.0.0.1';
    const rateLimit = checkRateLimit(`tenant_provision_${clientIp}`, {
      limit: 10,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Límite de peticiones de registro excedido. Intente más tarde.' },
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

    // 2. Validación obligatoria de la cabecera Idempotency-Key
    const idempotencyKey = request.headers.get('idempotency-key');
    if (!idempotencyKey || idempotencyKey.trim().length === 0) {
      return NextResponse.json(
        { error: 'La cabecera "Idempotency-Key" es obligatoria para esta operación.' },
        { status: 400 }
      );
    }

    // 3. Evaluar si la clave ya fue procesada (Idempotencia Replay)
    const cachedResponse = await getIdempotentResponse(idempotencyKey);
    if (cachedResponse.isCached) {
      return NextResponse.json(cachedResponse.responseBody, {
        status: cachedResponse.statusCode,
        headers: { 'X-Cache': 'HIT-IDEMPOTENCY' },
      });
    }

    // 4. Validación del cuerpo de la petición con Zod
    const body: unknown = await request.json();
    const validation = createTenantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos de registro de empresa inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 5. Ejecutar la lógica de negocio en el servicio
    const result = await createTenantWithSchema(validation.data);

    const successResponse = {
      message: 'Organización aprovisionada exitosamente con schema aislado',
      tenant: result,
    };

    // 6. Persistir el resultado para futuros reintentos con la misma clave (24 horas)
    await saveIdempotentResponse({
      key: idempotencyKey,
      statusCode: 201,
      responseBody: successResponse,
      ttlHours: 24,
    });

    return NextResponse.json(successResponse, {
      status: 201,
      headers: { 'X-Cache': 'MISS-IDEMPOTENCY' },
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}