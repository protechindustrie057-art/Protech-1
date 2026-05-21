import { getDb, jsonOk, readJson, handleApi } from '@/lib/apiServer'
import { createActivityLog, getActorFromBody } from '@/lib/activityLog'

export const dynamic = 'force-dynamic'

export async function GET() {
  return handleApi(async () => {
    const db = await getDb()
    const items = await db.collection('invoices').find().toArray()
    return jsonOk(items)
  })
}

export async function POST(req: Request) {
  return handleApi(async () => {
    const db = await getDb()
    const body = await readJson(req)
    const invoice = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    delete invoice.actor

    await db.collection('invoices').insertOne(invoice)
    await createActivityLog(db, {
      action: 'invoice_created',
      entity: 'invoices',
      entityId: invoice.id || null,
      actor: getActorFromBody(body),
      summary: `${invoice.type === 'ticket' ? 'Ticket' : 'Facture'} cree: ${invoice.numero || invoice.id}`,
      details: {
        numero: invoice.numero || null,
        type: invoice.type || null,
        total: invoice.total || 0,
        client: invoice.client || null,
      },
      request: req,
    })

    return jsonOk(invoice, 'Facture creee', 201)
  })
}
