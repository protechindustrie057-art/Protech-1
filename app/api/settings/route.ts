import { getDb, jsonError, jsonOk, readJson, handleApi } from '@/lib/apiServer'
import { createActivityLog, getActorFromBody } from '@/lib/activityLog'

export const dynamic = 'force-dynamic'

export async function GET() {
  return handleApi(async () => {
    const db = await getDb()
    const settings = await db.collection('settings').findOne<Record<string, unknown>>({ _id: 'settings' } as any)
    return jsonOk(settings || null)
  })
}

export async function PUT(req: Request) {
  return handleApi(async () => {
    const db = await getDb()
    const body = await readJson(req)
    if (!body || typeof body !== 'object') {
      return jsonError('Corps de la requete invalide', 400)
    }

    const update = {
      ...body,
      updatedAt: new Date(),
    }

    delete update.actor

    await db.collection('settings').updateOne({ _id: 'settings' } as any, { $set: update }, { upsert: true })
    const settings = await db.collection('settings').findOne<Record<string, unknown>>({ _id: 'settings' } as any)
    await createActivityLog(db, {
      action: 'settings_updated',
      entity: 'settings',
      entityId: 'settings',
      actor: getActorFromBody(body),
      summary: 'Parametres mis a jour',
      details: update,
      request: req,
    })

    return jsonOk(settings, 'Parametres mis a jour')
  })
}
