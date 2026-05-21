import { getDb, jsonError, jsonOk, readJson, handleApi } from '@/lib/apiServer'
import { createActivityLog, getActorFromBody } from '@/lib/activityLog'

export const dynamic = 'force-dynamic'

export async function GET() {
  return handleApi(async () => {
    const db = await getDb()
    const items = await db.collection('products').find().toArray()
    return jsonOk(items)
  })
}

export async function POST(req: Request) {
  return handleApi(async () => {
    const db = await getDb()
    const body = await readJson(req)

    const name = String(body.name || '').trim()
    const price = Number(body.price || 0)
    const stock = Number(body.stock || 0)

    if (!name || price <= 0) {
      return jsonError('Nom et prix sont requis', 400)
    }

    const id = typeof body.id === 'number' ? body.id : Math.floor(Date.now() / 1000)
    const doc = {
      id,
      name,
      price,
      stock,
      image: body.image || null,
      category_slug: body.category || body.category_slug || 'divers',
      alert_threshold: Number(body.alert_threshold || 5),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection('products').updateOne({ id }, { $set: doc }, { upsert: true })
    const product = await db.collection('products').findOne({ id })
    await createActivityLog(db, {
      action: 'product_created',
      entity: 'products',
      entityId: id,
      actor: getActorFromBody(body),
      summary: `Produit cree: ${name}`,
      details: { name, price, stock },
      request: req,
    })

    return jsonOk(product, 'Produit cree', 201)
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

    delete updates.actor
    delete updates.password

    if (body.price !== undefined) updates.price = Number(body.price)
    if (body.stock !== undefined) updates.stock = Number(body.stock)
    if (body.alert_threshold !== undefined) updates.alert_threshold = Number(body.alert_threshold)
    if (body.category !== undefined) updates.category_slug = body.category
    if (body.image !== undefined) updates.image = body.image
    if (body.name !== undefined) updates.name = body.name

    await db.collection('products').updateOne({ id: Number(id) }, { $set: updates })
    const product = await db.collection('products').findOne({ id: Number(id) })
    await createActivityLog(db, {
      action: 'product_updated',
      entity: 'products',
      entityId: Number(id),
      actor: getActorFromBody(body),
      summary: `Produit mis a jour: ${String(updates.name || product?.name || id)}`,
      details: updates,
      request: req,
    })

    return jsonOk(product, 'Produit mis a jour')
  })
}

export async function DELETE(req: Request) {
  return handleApi(async () => {
    const db = await getDb()
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return jsonError('ID requis', 400)

    const product = await db.collection('products').findOne({ id: Number(id) })
    await db.collection('products').deleteOne({ id: Number(id) })
    await createActivityLog(db, {
      action: 'product_deleted',
      entity: 'products',
      entityId: Number(id),
      summary: `Produit supprime: ${String(product?.name || id)}`,
      details: { id: Number(id), name: product?.name || null },
      request: req,
    })

    return jsonOk(null, 'Produit supprime')
  })
}
