import crypto from 'crypto'
import type { User } from './types'

const COOKIE_NAME = 'protech_google_session'

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SESSION_SECRET est requis en production.')
  }
  return 'dev-secret'
}

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url')
}

function sign(payload: string) {
  return crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url')
}

export function createGoogleSessionValue(user: User) {
  const payload = toBase64Url(JSON.stringify(user))
  return `${payload}.${sign(payload)}`
}

export function readGoogleSessionValue(value: string | undefined): User | null {
  if (!value) return null

  const [payload, signature] = value.split('.')
  if (!payload || !signature) return null

  const expected = sign(payload)
  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as User
  } catch {
    return null
  }
}

export { COOKIE_NAME }
