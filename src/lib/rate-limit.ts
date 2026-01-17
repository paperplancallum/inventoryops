/**
 * Simple in-memory rate limiting utility
 *
 * Note: This implementation uses an in-memory Map which works for single-instance
 * deployments. For production with multiple serverless instances, consider using:
 * - Upstash Redis (@upstash/ratelimit)
 * - Vercel KV
 * - Redis
 */

interface RateLimitRecord {
  count: number
  resetAt: number
}

const rateLimitMaps = new Map<string, Map<string, RateLimitRecord>>()

/**
 * Check if a request is within rate limits
 * @param key Unique identifier (e.g., IP address)
 * @param limit Maximum requests allowed in the window
 * @param windowMs Time window in milliseconds
 * @param namespace Optional namespace to separate different rate limits
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60 * 1000,
  namespace: string = 'default'
): boolean {
  const now = Date.now()

  // Get or create the namespace map
  if (!rateLimitMaps.has(namespace)) {
    rateLimitMaps.set(namespace, new Map())
  }
  const namespaceMap = rateLimitMaps.get(namespace)!

  const record = namespaceMap.get(key)

  if (!record || now > record.resetAt) {
    namespaceMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

/**
 * Get remaining requests and reset time for a key
 * @param key Unique identifier (e.g., IP address)
 * @param limit Maximum requests allowed in the window
 * @param namespace Optional namespace to separate different rate limits
 * @returns Object with remaining requests and reset timestamp
 */
export function getRateLimitInfo(
  key: string,
  limit: number = 10,
  namespace: string = 'default'
): { remaining: number; resetAt: number | null } {
  const namespaceMap = rateLimitMaps.get(namespace)

  if (!namespaceMap) {
    return { remaining: limit, resetAt: null }
  }

  const record = namespaceMap.get(key)
  const now = Date.now()

  if (!record || now > record.resetAt) {
    return { remaining: limit, resetAt: null }
  }

  return {
    remaining: Math.max(0, limit - record.count),
    resetAt: record.resetAt,
  }
}

/**
 * Clear rate limit records for a key
 * @param key Unique identifier (e.g., IP address)
 * @param namespace Optional namespace
 */
export function clearRateLimit(key: string, namespace: string = 'default'): void {
  const namespaceMap = rateLimitMaps.get(namespace)
  if (namespaceMap) {
    namespaceMap.delete(key)
  }
}

/**
 * Clear all expired rate limit records (garbage collection)
 */
export function cleanupExpiredRecords(): void {
  const now = Date.now()

  for (const [, namespaceMap] of rateLimitMaps) {
    for (const [key, record] of namespaceMap) {
      if (now > record.resetAt) {
        namespaceMap.delete(key)
      }
    }
  }
}

/**
 * Extract client IP from request headers
 * @param headers Request headers
 * @returns Client IP address or 'unknown'
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Anonymize IP address (mask last octet for privacy)
 * @param ip IP address
 * @returns Anonymized IP address
 */
export function anonymizeIp(ip: string): string {
  if (!ip) return ''

  // IPv4
  const ipv4Parts = ip.split('.')
  if (ipv4Parts.length === 4) {
    return `${ipv4Parts[0]}.${ipv4Parts[1]}.${ipv4Parts[2]}.xxx`
  }

  // IPv6 - mask the last segment
  return ip.replace(/:[^:]+$/, ':xxxx')
}

// Rate limit presets for different use cases
export const RATE_LIMITS = {
  // Public form endpoints - 10 requests per minute
  PUBLIC_FORM: { limit: 10, windowMs: 60 * 1000 },

  // Token validation - 10 requests per minute
  TOKEN_VALIDATION: { limit: 10, windowMs: 60 * 1000 },

  // Form submission - 5 requests per minute (more restrictive)
  FORM_SUBMISSION: { limit: 5, windowMs: 60 * 1000 },

  // API endpoints - 60 requests per minute
  API: { limit: 60, windowMs: 60 * 1000 },

  // Strict limit for sensitive operations - 3 requests per minute
  STRICT: { limit: 3, windowMs: 60 * 1000 },
} as const
