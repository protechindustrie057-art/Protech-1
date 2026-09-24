import { NextResponse } from 'next/server'
import { COOKIE_NAME, readGoogleSessionValue } from '@/lib/googleSession'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const cookie = req.headers.get('cookie')?.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))?.[1]
  const user = readGoogleSessionValue(cookie)

  return NextResponse.json({
    success: true,
    data: user ? { user } : null,
  })
}
