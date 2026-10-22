-- 1. Tabla de Riesgos (risks)
CREATE TABLE IF NOT EXISTS "{{SCHEMA_NAME}}".risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('BAJO', 'MEDIO', 'ALTO', 'CRITICO')),
    status VARCHAR(20) NOT NULL DEFAULT 'IDENTIFICADO' CHECK (status IN ('IDENTIFICADO', 'EN_TRATAMIENTO', 'MITIGADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Controles de Seguridad (controls)
CREATE TABLE IF NOT EXISTS "{{SCHEMA_NAME}}".controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('PREVENTIVO', 'DETECTIVO', 'CORRECTIVO')),
    periodicity VARCHAR(20) NOT NULL CHECK (periodicity IN ('DIARIO', 'SEMANAL', 'MENSUAL', 'TRIMESTRAL', 'ANUAL')),
    risk_id UUID REFERENCES "{{SCHEMA_NAME}}".risks(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Auditorías de Cumplimiento (audits)
CREATE TABLE IF NOT EXISTS "{{SCHEMA_NAME}}".audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_code VARCHAR(50) NOT NULL UNIQUE,
    auditor_name VARCHAR(255) NOT NULL,
    control_id UUID NOT NULL REFERENCES "{{SCHEMA_NAME}}".controls(id) ON DELETE RESTRICT,
    compliance_status VARCHAR(20) NOT NULL CHECK (compliance_status IN ('CONFORME', 'NO_CONFORME', 'OBSERVACION')),
    findings TEXT,
    audit_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas frecuentes por tenant
CREATE INDEX IF NOT EXISTS idx_{{SCHEMA_PREFIX}}_risks_severity ON "{{SCHEMA_NAME}}".risks(severity);
CREATE INDEX IF NOT EXISTS idx_{{SCHEMA_PREFIX}}_controls_risk_id ON "{{SCHEMA_NAME}}".controls(risk_id);
CREATE INDEX IF NOT EXISTS idx_{{SCHEMA_PREFIX}}_audits_control_id ON "{{SCHEMA_NAME}}".audits(control_id);