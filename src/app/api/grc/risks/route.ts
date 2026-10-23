import { NextRequest, NextResponse } from 'next/server';
import { createRiskSchema } from '@/schemas/grc.schema';
import { listRisks, createRisk } from '@/services/grc.service';
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

    const risks = await listRisks(schemaName);
    return NextResponse.json({ data: risks }, { status: 200 });
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

    const body: unknown = await request.json();
    const validation = createRiskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos de riesgo inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const newRisk = await createRisk(schemaName, validation.data);
    return NextResponse.json(
      { message: 'Riesgo registrado con éxito', data: newRisk },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}