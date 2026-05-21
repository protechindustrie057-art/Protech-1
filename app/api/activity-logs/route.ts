import { getDb, jsonError, jsonOk, readJson, handleApi } from '@/lib/apiServer'
import { createActivityLog, getActorFromBody } from '@/lib/activityLog'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  return handleApi(async () => {
    const db = await getDb()
    const url = new URL(req.url)
    const limit = Math.min(Number(url.searchParams.get('limit') || 100), 500)

    const logs = await db
      .collection('activity_logs')
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    return jsonOk(logs)
  })
}

export async function POST(req: Request) {
  return handleApi(async () => {
    const db = await getDb()
    const body = await readJson(req)
    const action = String(body.action || '').trim()
    const summary = String(body.summary || '').trim()

    if (!action || !summary) {
      return jsonError('Action et resume requis', 400)
    }

    await createActivityLog(db, {
      action: action as any,
      entity: String(body.entity || 'app'),
      entityId: body.entityId ?? null,
      actor: getActorFromBody(body),
      summary,
      details: body.details || {},
      request: req,
    })

    return jsonOk(null, 'Activite enregistree', 201)
  })
}
