export interface ProvisionTenantInput {
  name: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
}

export interface ProvisionTenantResult {
  tenantId: string;
  name: string;
  slug: string;
  schemaName: string;
  adminId: string;
  adminEmail: string;
}