import { NextRequest, NextResponse } from 'next/server'

function splitEnvList(value: string | undefined) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function isLocalOrigin(origin: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
}

function getAllowedOrigin(origin: string | null) {
  if (!origin) return ''

  const allowedOrigins = new Set([
    ...splitEnvList(process.env.CORS_ALLOWED_ORIGINS),
    process.env.NEXT_PUBLIC_SITE_URL || '',
    process.env.GOOGLE_REDIRECT_ORIGIN || '',
  ].filter(Boolean))

  if (isLocalOrigin(origin) || allowedOrigins.has(origin)) return origin
  return ''
}

function applyCorsHeaders(response: NextResponse, origin: string | null) {
  const allowedOrigin = getAllowedOrigin(origin)
  if (!allowedOrigin) return response

  response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Token')
  response.headers.set('Access-Control-Max-Age', '86400')
  response.headers.set('Vary', 'Origin')
  return response
}

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/api/')) return NextResponse.next()

  if (req.method === 'OPTIONS') {
    return applyCorsHeaders(new NextResponse(null, { status: 204 }), req.headers.get('origin'))
  }

  return applyCorsHeaders(NextResponse.next(), req.headers.get('origin'))
}

export const config = {
  matcher: '/api/:path*',
}
