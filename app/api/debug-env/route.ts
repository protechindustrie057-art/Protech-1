import { NextResponse } from 'next/server'

export async function GET() {
  // Never return secrets.
  const hasMongoUri = Boolean(process.env.MONGODB_URI)
  const dbName = process.env.MONGODB_DB
  const mongoUriPrefix = process.env.MONGODB_URI ? process.env.MONGODB_URI.slice(0, 25) : null

  return NextResponse.json({
    MONGODB_URI_present: hasMongoUri,
    MONGODB_DB: dbName ?? null,
    MONGODB_URI_prefix: mongoUriPrefix,
  })
}

