import { getDb, jsonError, jsonOk, readJson, handleApi } from '@/lib/apiServer'

export const dynamic = 'force-dynamic'

const ONLINE_WINDOW_MS = 2 * 60 * 1000

export async function GET() {
  return handleApi(async () => {
    const db = await getDb()
    const since = new Date(Date.now() - ONLINE_WINDOW_MS)
    const items = await db
      .collection('user_presence')
      .find({ status: 'online', lastSeenAt: { $gte: since } })
      .sort({ lastSeenAt: -1 })
      .toArray()

    return jsonOk(items)
  })
}

export async function POST(req: Request) {
  return handleApi(async () => {
    const db = await getDb()
    const body = await readJson(req)
    const sourceUser = body.user || body
    const userId = Number(sourceUser.id || sourceUser.userId || 0)
    const name = String(sourceUser.name || '').trim()
    const email = String(sourceUser.email || '').trim().toLowerCase()
    const role = String(sourceUser.role || '')
    const machineId = String(body.machineId || sourceUser.machineId || '').trim()
    const machineName = String(body.machineName || body.machineLabel || sourceUser.machineName || '').trim()
    const status = body.status === 'offline' ? 'offline' : 'online'

    if (!userId || !email || !role || !machineId) {
      return jsonError('Presence invalide', 400)
    }

    const now = new Date()
    await db.collection('user_presence').updateOne(
      { userId, machineId },
      {
        $set: {
          userId,
          name: name || email,
          email,
          role,
          machineId,
          machineName: machineName || 'Machine inconnue',
          status,
          lastSeenAt: now,
          userAgent: req.headers.get('user-agent') || null,
          ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    )

    return jsonOk(null, 'Presence mise a jour')
  })
}

export async function DELETE(req: Request) {
  return handleApi(async () => {
    const db = await getDb()
    const url = new URL(req.url)
    const machineId = url.searchParams.get('machineId')
    if (!machineId) return jsonError('machineId requis', 400)

    await db.collection('user_presence').updateMany(
      { machineId },
      { $set: { status: 'offline', updatedAt: new Date(), lastSeenAt: new Date() } },
    )

    return jsonOk(null, 'Presence terminee')
  })
}
