import { getMongoDb } from '@/lib/mongodb'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = await getMongoDb()
    const collections = await db.listCollections().toArray()

    return NextResponse.json({
      success: true,
      message: 'Connexion MongoDB reussie !',
      database: process.env.MONGODB_DB || 'sk_parfumerie',
      collections: collections.map((c) => c.name),
    })
  } catch (error) {
    console.error('Erreur MongoDB:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
