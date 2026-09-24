import { NextResponse } from 'next/server'
import { requireInternalEndpointAccess } from '@/lib/internalEndpoint'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const denied = requireInternalEndpointAccess(req, {
    enabledEnv: 'ENABLE_DEBUG_ENV',
    tokenEnv: 'DEBUG_ENV_TOKEN',
  })
  if (denied) return denied

  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV || null,
    MONGODB_URI_present: Boolean(process.env.MONGODB_URI),
    MONGODB_DB_present: Boolean(process.env.MONGODB_DB),
    ADMIN_EMAIL_present: Boolean(process.env.ADMIN_EMAIL),
    ADMIN_INITIAL_PASSWORD_present: Boolean(process.env.ADMIN_INITIAL_PASSWORD),
    AUTH_SESSION_SECRET_present: Boolean(process.env.AUTH_SESSION_SECRET),
    GOOGLE_CLIENT_ID_present: Boolean(process.env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET_present: Boolean(process.env.GOOGLE_CLIENT_SECRET),
  })
}

