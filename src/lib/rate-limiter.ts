import {
  RateLimitRecord,
  RateLimitOptions,
  RateLimitResult,
} from '@/types/rate-limiter.types';

const requestStore = new Map<string, RateLimitRecord>();

/**
 * Evalúa y registra una petición contra una ventana deslizante de tiempo.
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const { limit, windowMs } = options;
  const now = Date.now();
  const windowStart = now - windowMs;

  const record = requestStore.get(key) ?? { timestamps: [] };

  // Conservar solo las marcas de tiempo que caen dentro de la ventana activa
  const validTimestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (validTimestamps.length >= limit) {
    const oldestTimestamp = validTimestamps[0];
    const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

    return {
      success: false,
      limit,
      remaining: 0,
      retryAfter: Math.max(retryAfter, 1),
    };
  }

  validTimestamps.push(now);
  requestStore.set(key, { timestamps: validTimestamps });

  return {
    success: true,
    limit,
    remaining: limit - validTimestamps.length,
    retryAfter: 0,
  };
}