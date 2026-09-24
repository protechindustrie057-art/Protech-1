import { getMongoDb } from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { requireInternalEndpointAccess } from '@/lib/internalEndpoint'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  const denied = requireInternalEndpointAccess(req, {
    enabledEnv: 'ENABLE_TEST_API',
    tokenEnv: 'TEST_API_TOKEN',
  })
  if (denied) return denied

  try {
    const db = await getMongoDb()
    const collections = await db.listCollections().toArray()

    return NextResponse.json({
      success: true,
      message: 'Connexion MongoDB reussie !',
      database_present: Boolean(process.env.MONGODB_DB),
      collections: collections.map((c) => c.name),
    })
  } catch (error) {
    console.error('Erreur MongoDB:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur MongoDB',
      },
      { status: 500 },
    )
  }
}
