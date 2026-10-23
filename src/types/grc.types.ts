export type RiskSeverity = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
export type RiskStatus = 'IDENTIFICADO' | 'EN_TRATAMIENTO' | 'MITIGADO';

export interface Risk {
  id: string;
  code: string;
  title: string;
  description: string | null;
  severity: RiskSeverity;
  status: RiskStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ControlType = 'PREVENTIVO' | 'DETECTIVO' | 'CORRECTIVO';
export type ControlPeriodicity = 'DIARIO' | 'SEMANAL' | 'MENSUAL' | 'TRIMESTRAL' | 'ANUAL';

export interface Control {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: ControlType;
  periodicity: ControlPeriodicity;
  riskId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AuditComplianceStatus = 'CONFORME' | 'NO_CONFORME' | 'OBSERVACION';

export interface Audit {
  id: string;
  auditCode: string;
  auditorName: string;
  controlId: string;
  complianceStatus: AuditComplianceStatus;
  findings: string;
  auditDate: Date;
  createdAt: Date;
}