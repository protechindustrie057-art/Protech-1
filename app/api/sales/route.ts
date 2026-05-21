import { getDb, jsonError, jsonOk, readJson, handleApi } from '@/lib/apiServer'
import { createActivityLog, getActorFromBody } from '@/lib/activityLog'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  return handleApi(async () => {
    const db = await getDb()
    const body = await readJson(req)
    if (!body || typeof body !== 'object') {
      return jsonError('Corps de la requete invalide', 400)
    }

    const sale = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    delete sale.actor

    await db.collection('sales').insertOne(sale)
    await createActivityLog(db, {
      action: 'sale_created',
      entity: 'sales',
      entityId: sale.id || null,
      actor: getActorFromBody(body),
      summary: `Vente enregistree: ${Number(sale.total || 0)}`,
      details: {
        total: sale.total || 0,
        itemCount: Array.isArray(sale.items) ? sale.items.length : 0,
      },
      request: req,
    })

    return jsonOk(sale, 'Vente enregistree', 201)
  })
}
