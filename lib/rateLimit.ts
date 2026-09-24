import { jsonError } from './apiServer'

type Bucket = {
  count: number
  resetAt: number
}

type RateLimitOptions = {
  key: string
  limit: number
  windowMs: number
}

const globalRateLimitStore = globalThis as typeof globalThis & {
  __skRateLimitStore?: Map<string, Bucket>
}

const buckets = globalRateLimitStore.__skRateLimitStore || new Map<string, Bucket>()
globalRateLimitStore.__skRateLimitStore = buckets

export function getClientIp(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwardedFor || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || 'unknown'
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now()
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  current.count += 1
  if (current.count <= limit) return null

  const retryAfter = Math.ceil((current.resetAt - now) / 1000)
  return jsonError(`Trop de tentatives. Reessayez dans ${retryAfter} secondes.`, 429)
}

export function rateLimitAuth(req: Request, action: string, identifier = '') {
  const ip = getClientIp(req)
  const suffix = identifier.trim().toLowerCase()
  return checkRateLimit({
    key: ['auth', action, ip, suffix].filter(Boolean).join(':'),
    limit: 10,
    windowMs: 15 * 60 * 1000,
  })
}
