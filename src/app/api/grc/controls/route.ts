import { NextRequest, NextResponse } from 'next/server';
import { createControlSchema } from '@/schemas/grc.schema';
import { listControls, createControl } from '@/services/grc.service';
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

    const controls = await listControls(schemaName);
    return NextResponse.json({ data: controls }, { status: 200 });
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
    const validation = createControlSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos de control SOC 2 inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const newControl = await createControl(schemaName, validation.data);
    return NextResponse.json(
      { message: 'Control registrado con éxito', data: newControl },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}