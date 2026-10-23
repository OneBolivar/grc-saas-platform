import { NextRequest, NextResponse } from 'next/server';
import { createAuditSchema } from '@/schemas/grc.schema';
import { listAudits, createAudit } from '@/services/grc.service';
import {
  getIdempotentResponse,
  saveIdempotentResponse,
} from '@/lib/idempotency';
import { getErrorMessage } from '@/lib/errors';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const schemaName = request.headers.get('x-schema-name');
    if (!schemaName) {
      return NextResponse.json(
        { error: 'Contexto de organización no encontrado en la sesión' },
        { status: 403 }
      );
    }

    const audits = await listAudits(schemaName);
    return NextResponse.json({ data: audits }, { status: 200 });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const schemaName = request.headers.get('x-schema-name');
    if (!schemaName) {
      return NextResponse.json(
        { error: 'Contexto de organización no encontrado en la sesión' },
        { status: 403 }
      );
    }

    // 1. Exigir la cabecera obligatoria de idempotencia
    const idempotencyKey = request.headers.get('idempotency-key');
    if (!idempotencyKey || idempotencyKey.trim().length === 0) {
      return NextResponse.json(
        { error: 'La cabecera "Idempotency-Key" es obligatoria al emitir una auditoría.' },
        { status: 400 }
      );
    }

    // 2. Comprobar si ya fue procesada en las últimas 24 horas
    const cachedResponse = await getIdempotentResponse(idempotencyKey);
    if (cachedResponse.isCached) {
      return NextResponse.json(cachedResponse.responseBody, {
        status: cachedResponse.statusCode,
        headers: { 'X-Cache': 'HIT-IDEMPOTENCY' },
      });
    }

    // 3. Validar los datos con Zod
    const body: unknown = await request.json();
    const validation = createAuditSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos de auditoría inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 4. Crear el registro en el schema aislado
    const newAudit = await createAudit(schemaName, validation.data);

    const successResponse = {
      message: 'Dictamen de auditoría registrado con éxito',
      data: newAudit,
    };

    // 5. Guardar la respuesta para reintentos con la misma clave
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