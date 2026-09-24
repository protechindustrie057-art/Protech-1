import crypto from 'crypto'
import { NextResponse } from 'next/server'

function readBearerToken(req: Request) {
  const authorization = req.headers.get('authorization') || ''
  if (authorization.toLowerCase().startsWith('bearer ')) return authorization.slice(7).trim()
  return req.headers.get('x-api-token')?.trim() || ''
}

function safeEquals(left: string, right: string) {
  if (!left || !right) return false
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

export function requireInternalEndpointAccess(req: Request, options: { enabledEnv: string; tokenEnv: string }) {
  const enabled = process.env[options.enabledEnv] === 'true'
  const requiredToken = process.env[options.tokenEnv]

  if (!enabled) {
    return NextResponse.json({ success: false, message: 'Endpoint indisponible' }, { status: 404 })
  }

  if (process.env.NODE_ENV === 'production' && !requiredToken) {
    return NextResponse.json({ success: false, message: 'Endpoint non configure' }, { status: 404 })
  }

  if (requiredToken && !safeEquals(readBearerToken(req), requiredToken)) {
    return NextResponse.json({ success: false, message: 'Non autorise' }, { status: 401 })
  }

  return null
}
