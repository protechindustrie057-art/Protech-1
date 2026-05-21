import type { Db } from 'mongodb'

type ActivityAction =
  | 'login'
  | 'logout'
  | 'product_created'
  | 'product_updated'
  | 'product_deleted'
  | 'sale_created'
  | 'invoice_created'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'settings_updated'

type Actor = {
  id?: number | string | null
  name?: string | null
  email?: string | null
  role?: string | null
}

type ActivityLogInput = {
  action: ActivityAction
  entity: string
  entityId?: number | string | null
  actor?: Actor | null
  summary: string
  details?: Record<string, unknown>
  request?: Request
}

function sanitizeDetails(details: Record<string, unknown> = {}) {
  const blocked = new Set(['password', 'currentPassword', 'newPassword', 'confirmPassword'])
  return Object.fromEntries(Object.entries(details).filter(([key]) => !blocked.has(key)))
}

export async function createActivityLog(db: Db, input: ActivityLogInput) {
  const now = new Date()
  const actor = input.actor || {}
  const ip =
    input.request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    input.request?.headers.get('x-real-ip') ||
    null

  await db.collection('activity_logs').insertOne({
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ?? null,
    actor: {
      id: actor.id ?? null,
      name: actor.name || 'Utilisateur inconnu',
      email: actor.email ?? null,
      role: actor.role ?? null,
    },
    summary: input.summary,
    details: sanitizeDetails(input.details),
    ip,
    userAgent: input.request?.headers.get('user-agent') || null,
    createdAt: now,
    updatedAt: now,
  })
}

export function getActorFromBody(body: any): Actor | null {
  if (body?.actor && typeof body.actor === 'object') return body.actor

  const name = body?.cashier || body?.caissier || body?.createdBy || body?.updatedBy
  if (!name) return null

  return { name: String(name) }
}
