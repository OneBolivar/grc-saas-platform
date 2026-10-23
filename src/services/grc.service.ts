import { randomUUID } from 'crypto';
import { withTenantContext } from '@/lib/tenant-context';
import {
  Risk,
  Control,
  Audit,
} from '@/types/grc.types';
import {
  CreateRiskInput,
  CreateControlInput,
  CreateAuditInput,
} from '@/schemas/grc.schema';

// -----------------------------------------------------------------------------
// RIESGOS (risks)
// -----------------------------------------------------------------------------

export async function listRisks(schemaName: string): Promise<Risk[]> {
  return await withTenantContext(schemaName, async (tx) => {
    const records = await tx.$queryRaw<Risk[]>`
      SELECT 
        id, 
        code, 
        title, 
        description, 
        severity, 
        status, 
        created_at AS "createdAt", 
        updated_at AS "updatedAt"
      FROM risks
      ORDER BY created_at DESC;
    `;
    return records;
  });
}

export async function createRisk(schemaName: string, input: CreateRiskInput): Promise<Risk> {
  const { code, title, description, severity, status } = input;
  const id = randomUUID();

  return await withTenantContext(schemaName, async (tx) => {
    const created = await tx.$queryRaw<Risk[]>`
      INSERT INTO risks (id, code, title, description, severity, status, created_at, updated_at)
      VALUES (${id}::uuid, ${code}, ${title}, ${description ?? null}, ${severity}, ${status}, NOW(), NOW())
      RETURNING 
        id, 
        code, 
        title, 
        description, 
        severity, 
        status, 
        created_at AS "createdAt", 
        updated_at AS "updatedAt";
    `;

    return created[0];
  });
}

// -----------------------------------------------------------------------------
// CONTROLES COMMON CRITERIA (controls)
// -----------------------------------------------------------------------------

export async function listControls(schemaName: string): Promise<Control[]> {
  return await withTenantContext(schemaName, async (tx) => {
    const records = await tx.$queryRaw<Control[]>`
      SELECT 
        id, 
        code, 
        name, 
        description, 
        type, 
        periodicity, 
        risk_id AS "riskId", 
        created_at AS "createdAt", 
        updated_at AS "updatedAt"
      FROM controls
      ORDER BY created_at DESC;
    `;
    return records;
  });
}

export async function createControl(schemaName: string, input: CreateControlInput): Promise<Control> {
  const { code, name, description, type, periodicity, riskId } = input;
  const id = randomUUID();

  return await withTenantContext(schemaName, async (tx) => {
    const created = await tx.$queryRaw<Control[]>`
      INSERT INTO controls (id, code, name, description, type, periodicity, risk_id, created_at, updated_at)
      VALUES (${id}::uuid, ${code}, ${name}, ${description ?? null}, ${type}, ${periodicity}, ${riskId ? riskId : null}::uuid, NOW(), NOW())
      RETURNING 
        id, 
        code, 
        name, 
        description, 
        type, 
        periodicity, 
        risk_id AS "riskId", 
        created_at AS "createdAt", 
        updated_at AS "updatedAt";
    `;

    return created[0];
  });
}

// -----------------------------------------------------------------------------
// AUDITORÍAS (audits)
// -----------------------------------------------------------------------------

export async function listAudits(schemaName: string): Promise<Audit[]> {
  return await withTenantContext(schemaName, async (tx) => {
    const records = await tx.$queryRaw<Audit[]>`
      SELECT 
        id, 
        audit_code AS "auditCode", 
        auditor_name AS "auditorName", 
        control_id AS "controlId", 
        compliance_status AS "complianceStatus", 
        findings, 
        audit_date AS "auditDate", 
        created_at AS "createdAt"
      FROM audits
      ORDER BY audit_date DESC;
    `;
    return records;
  });
}

export async function createAudit(schemaName: string, input: CreateAuditInput): Promise<Audit> {
  const { auditCode, auditorName, controlId, complianceStatus, findings } = input;
  const id = randomUUID();

  return await withTenantContext(schemaName, async (tx) => {
    const created = await tx.$queryRaw<Audit[]>`
      INSERT INTO audits (id, audit_code, auditor_name, control_id, compliance_status, findings, audit_date, created_at)
      VALUES (${id}::uuid, ${auditCode}, ${auditorName}, ${controlId}::uuid, ${complianceStatus}, ${findings}, NOW(), NOW())
      RETURNING 
        id, 
        audit_code AS "auditCode", 
        auditor_name AS "auditorName", 
        control_id AS "controlId", 
        compliance_status AS "complianceStatus", 
        findings, 
        audit_date AS "auditDate", 
        created_at AS "createdAt";
    `;

    return created[0];
  });
}