import { getDb, handleApi, jsonOk, readJson, jsonError } from '@/lib/apiServer'
import { createActivityLog, getActorFromBody } from '@/lib/activityLog'

export const dynamic = 'force-dynamic'

export async function GET() {
  return handleApi(async () => {
    const db = await getDb()
    const reports = await db.collection('daily_reports').find().sort({ createdAt: -1 }).limit(200).toArray()
    return jsonOk(reports)
  })
}

export async function POST(req: Request) {
  return handleApi(async () => {
    const db = await getDb()
    const body = await readJson(req)
    const cashierName = String(body.cashierName || '').trim()
    const cashierEmail = String(body.cashierEmail || '').trim().toLowerCase()
    const reportDate = String(body.reportDate || new Date().toISOString().slice(0, 10))
    const expenses = Number(body.expenses || 0)
    const cashAmount = Number(body.cashAmount || 0)
    const mobileAmount = Number(body.mobileAmount || 0)
    const notes = String(body.notes || '').trim()

    if (!cashierName || !cashierEmail) {
      return jsonError('Caissier requis', 400)
    }

    if (!notes && expenses <= 0 && cashAmount <= 0 && mobileAmount <= 0) {
      return jsonError('Rapport vide', 400)
    }

    const id = String(body.id || `report-${Date.now()}`)
    const report = {
      id,
      reportDate,
      cashierId: body.cashierId ? Number(body.cashierId) : null,
      cashierName,
      cashierEmail,
      expenses,
      cashAmount,
      mobileAmount,
      notes,
      status: 'envoye',
      createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
      syncedAt: new Date(),
    }

    await db.collection('daily_reports').updateOne({ id }, { $set: report }, { upsert: true })
    await createActivityLog(db, {
      action: 'settings_updated',
      entity: 'daily_reports',
      entityId: id,
      actor: getActorFromBody(body),
      summary: `Rapport journalier envoye: ${cashierName}`,
      details: { reportDate, expenses, cashAmount, mobileAmount },
      request: req,
    })

    return jsonOk(report, 'Rapport envoye', 201)
  })
}
