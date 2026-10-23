export interface IdempotencyRecord {
  id: string;
  key: string;
  statusCode: number;
  responseBody: unknown;
  createdAt: Date;
  expiresAt: Date;
}

export interface SaveIdempotencyInput {
  key: string;
  statusCode: number;
  responseBody: unknown;
  ttlHours?: number;
}

export type IdempotencyCheckResult =
  | { isCached: true; statusCode: number; responseBody: unknown }
  | { isCached: false };