import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import {
  ProvisionTenantInput,
  ProvisionTenantResult,
} from '@/types/tenant.types';

/**
 * Sanitiza un slug para generar un nombre de schema seguro en PostgreSQL.
 */
export function buildSchemaName(slug: string): string {
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return `tenant_${cleanSlug}`;
}

/**
 * Carga la plantilla DDL e inyecta el nombre real del schema.
 */
function getTenantDdlScript(schemaName: string): string {
  const templatePath = path.join(process.cwd(), 'src/lib/tenant-schema.sql');

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Plantilla DDL no encontrada en: ${templatePath}`);
  }

  const rawSql = fs.readFileSync(templatePath, 'utf-8');
  const schemaPrefix = schemaName.replace(/[^a-z0-9]/g, '');

  return rawSql
    .replace(/\{\{SCHEMA_NAME\}\}/g, schemaName)
    .replace(/\{\{SCHEMA_PREFIX\}\}/g, schemaPrefix);
}

/**
 * Ejecuta atómicamente la creación del tenant en 'public' y el despliegue del schema dinámico.
 */
export async function createTenantWithSchema(
  input: ProvisionTenantInput
): Promise<ProvisionTenantResult> {
  const { name, slug, adminEmail, adminPassword } = input;
  const schemaName = buildSchemaName(slug);

  // 1. Verificación previa de unicidad en el Control Plane
  const tenantExists = await prisma.tenant.findFirst({
    where: {
      OR: [{ slug }, { schemaName }],
    },
  });

  if (tenantExists) {
    throw new Error(`La organización con slug "${slug}" o schema "${schemaName}" ya existe.`);
  }

  const userExists = await prisma.user.findUnique({
    where: { email: adminEmail.toLowerCase().trim() },
  });

  if (userExists) {
    throw new Error(`El correo "${adminEmail}" ya se encuentra registrado en el sistema.`);
  }

  // 2. Hash de contraseña con bcrypt (10 rondas de salt)
  const passwordHash = await hashPassword(adminPassword);

  // 3. Preparación del script DDL
  const ddlScript = getTenantDdlScript(schemaName);

  // 4. Ejecución atómica mediante transacción de Prisma
  return await prisma.$transaction(async (tx) => {
    // Registro global de la organización
    const tenant = await tx.tenant.create({
      data: {
        name,
        slug,
        schemaName,
      },
    });

    // Registro del Administrador del Tenant (rol ADMIN)
    const adminUser = await tx.user.create({
      data: {
        tenantId: tenant.id,
        email: adminEmail.toLowerCase().trim(),
        passwordHash,
        role: 'ADMIN',
      },
    });

    // Despliegue físico en PostgreSQL
    await tx.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
    await tx.$executeRawUnsafe(ddlScript);

    return {
      tenantId: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      schemaName: tenant.schemaName,
      adminId: adminUser.id,
      adminEmail: adminUser.email,
    };
  });
}