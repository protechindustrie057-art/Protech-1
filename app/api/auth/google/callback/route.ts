import { NextResponse } from 'next/server'
import { getDb } from '@/lib/apiServer'
import { createActivityLog } from '@/lib/activityLog'
import { COOKIE_NAME, createGoogleSessionValue } from '@/lib/googleSession'
import { getOAuthOrigin } from '@/lib/oauthOrigin'
import { rateLimitAuth } from '@/lib/rateLimit'
import type { User, UserRole } from '@/lib/types'

export const dynamic = 'force-dynamic'

type GoogleUserInfo = {
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
}

function splitEnvList(value: string | undefined) {
  return new Set(
    String(value || '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  )
}

function redirectWithError(origin: string, message: string) {
  const url = new URL(origin)
  url.searchParams.set('auth_error', message)
  return NextResponse.redirect(url)
}

export async function GET(req: Request) {
  const limited = rateLimitAuth(req, 'google-callback')
  if (limited) return limited

  const requestUrl = new URL(req.url)
  const origin = getOAuthOrigin(req)
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  const expectedState = req.headers.get('cookie')?.match(/(?:^|;\s*)protech_google_state=([^;]+)/)?.[1]

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWithError(origin, 'google_state_invalide')
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret || (process.env.NODE_ENV === 'production' && !process.env.AUTH_SESSION_SECRET)) {
    return redirectWithError(origin, 'google_config_manquante')
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${origin}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenResponse.ok) {
    return redirectWithError(origin, 'google_token_refuse')
  }

  const tokens = await tokenResponse.json()
  const userResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!userResponse.ok) {
    return redirectWithError(origin, 'google_profil_refuse')
  }

  const profile = (await userResponse.json()) as GoogleUserInfo
  const email = profile.email?.toLowerCase()
  if (!email || !profile.email_verified) {
    return redirectWithError(origin, 'google_email_non_verifie')
  }

  const allowedEmails = splitEnvList(process.env.GOOGLE_ALLOWED_EMAILS)
  const adminEmails = splitEnvList(process.env.GOOGLE_ADMIN_EMAILS)
  if (!allowedEmails.has(email) && !adminEmails.has(email)) {
    return redirectWithError(origin, 'google_email_non_autorise')
  }

  const db = await getDb()
  const existingUser = await db.collection('users').findOne<{ id?: number; name?: string; role?: UserRole }>({ email })
  const role: UserRole = adminEmails.has(email) ? 'admin' : existingUser?.role || 'manager'
  const user: User = {
    id: existingUser?.id || Date.now(),
    name: existingUser?.name || profile.name || email,
    email,
    role,
    status: 'actif',
  }

  await createActivityLog(db, {
    action: 'login',
    entity: 'auth',
    actor: user,
    summary: `${user.name} s'est connecte avec Google`,
    request: req,
  })

  const response = NextResponse.redirect(origin)
  response.cookies.delete('protech_google_state')
  response.cookies.set(COOKIE_NAME, createGoogleSessionValue(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
