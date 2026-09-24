import { NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/googleSession'
import { rateLimitAuth } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const limited = rateLimitAuth(req, 'logout')
  if (limited) return limited

  const response = NextResponse.json({ success: true, data: null })
  response.cookies.delete(COOKIE_NAME)
  return response
}
