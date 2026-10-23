export interface RateLimitRecord {
  timestamps: number[];
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  retryAfter: number;
}