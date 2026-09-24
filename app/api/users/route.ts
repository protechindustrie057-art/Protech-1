import { getDb, jsonError, jsonOk, readJson, handleApi } from '@/lib/apiServer'
import { createActivityLog, getActorFromBody } from '@/lib/activityLog'
import { hashServerPassword, MIN_PASSWORD_LENGTH } from '@/lib/serverPassword'

export const dynamic = 'force-dynamic'

export async function GET() {
  return handleApi(async () => {
    const db = await getDb()
    const items = await db.collection('users').find().toArray()
    const since = new Date(Date.now() - 2 * 60 * 1000)
    const presence = await db
      .collection('user_presence')
      .find({ status: 'online', lastSeenAt: { $gte: since } })
      .sort({ lastSeenAt: -1 })
      .toArray()

    const presenceByUser = new Map<number, any>()
    for (const item of presence) {
      if (!presenceByUser.has(item.userId)) presenceByUser.set(item.userId, item)
    }

    const withPresence = items.map((item: any) => {
      const userPresence = presenceByUser.get(Number(item.id))
      return {
        ...item,
        online: Boolean(userPresence),
        last_seen: userPresence?.lastSeenAt || item.last_login || null,
        machine_id: userPresence?.machineId || null,
        machine_label: userPresence?.machineLabel || null,
      }
    })

    return jsonOk(withPresence)
  })
}

export async function POST(req: Request) {
  return handleApi(async () => {
    const db = await getDb()
    const body = await readJson(req)
    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim()
    const role = String(body.role || 'caisse')

    if (!name || !email) {
      return jsonError('Nom et email sont requis', 400)
    }

    const id = typeof body.id === 'number' ? body.id : Math.floor(Date.now() / 1000)
    const doc = {
      ...body,
      id,
      name,
      email,
      role,
      caisse_number: body.caisse_number !== undefined ? Number(body.caisse_number) : null,
      status: body.status || 'actif',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    delete doc.password
    delete doc.actor

    const password = String(body.password || '')
    if (password && password.length < MIN_PASSWORD_LENGTH) {
      return jsonError(`Mot de passe trop court (min ${MIN_PASSWORD_LENGTH} caracteres)`, 400)
    }

    if (password) {
      doc.passwordHash = hashServerPassword(password)
    }

    await db.collection('users').updateOne({ id }, { $set: doc }, { upsert: true })
    const user = await db.collection('users').findOne({ id })
    await createActivityLog(db, {
      action: 'user_created',
      entity: 'users',
      entityId: id,
      actor: getActorFromBody(body),
      summary: `Utilisateur cree: ${name}`,
      details: { id, name, email, role },
      request: req,
    })

    return jsonOk(user, 'Utilisateur cree', 201)
  })
}

export async function PUT(req: Request) {
  return handleApi(async () => {
    const db = await getDb()
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return jsonError('ID requis', 400)

    const body = await readJson(req)
    const updates: Record<string, unknown> = {
      ...body,
      updatedAt: new Date(),
    }

    delete updates.password
    delete updates.actor

    const password = String(body.password || '')
    if (password && password.length < MIN_PASSWORD_LENGTH) {
      return jsonError(`Mot de passe trop court (min ${MIN_PASSWORD_LENGTH} caracteres)`, 400)
    }

    if (password) {
      updates.passwordHash = hashServerPassword(password)
    }

    if (body.caisse_number !== undefined) updates.caisse_number = Number(body.caisse_number)
    await db.collection('users').updateOne({ id: Number(id) }, { $set: updates })
    const user = await db.collection('users').findOne({ id: Number(id) })
    await createActivityLog(db, {
      action: 'user_updated',
      entity: 'users',
      entityId: Number(id),
      actor: getActorFromBody(body),
      summary: `Utilisateur mis a jour: ${String(updates.name || user?.name || id)}`,
      details: updates,
      request: req,
    })

    return jsonOk(user, 'Utilisateur mis a jour')
  })
}

export async function DELETE(req: Request) {
  return handleApi(async () => {
    const db = await getDb()
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return jsonError('ID requis', 400)

    const user = await db.collection('users').findOne({ id: Number(id) })
    await db.collection('users').deleteOne({ id: Number(id) })
    await createActivityLog(db, {
      action: 'user_deleted',
      entity: 'users',
      entityId: Number(id),
      summary: `Utilisateur supprime: ${String(user?.name || id)}`,
      details: { id: Number(id), name: user?.name || null, email: user?.email || null },
      request: req,
    })

    return jsonOk(null, 'Utilisateur supprime')
  })
}
