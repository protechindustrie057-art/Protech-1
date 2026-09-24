import { getDb, jsonError, jsonOk, readJson, handleApi } from '@/lib/apiServer'
import { createActivityLog } from '@/lib/activityLog'
import { hashServerPassword, MIN_PASSWORD_LENGTH, verifyServerPassword } from '@/lib/serverPassword'
import { rateLimitAuth } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@protechtouch.com'
const DEFAULT_ADMIN_NAME = process.env.ADMIN_NAME || 'Administrateur'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function getCredential(db: Awaited<ReturnType<typeof getDb>>) {
  return db.collection('app_credentials').findOne<{ email?: string; name?: string; passwordHash: string }>({ key: 'admin' })
}

async function getOrCreateCredential(db: Awaited<ReturnType<typeof getDb>>) {
  const existing = await getCredential(db)
  if (existing) return existing

  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD
  if (!initialPassword) return null
  if (initialPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_INITIAL_PASSWORD doit contenir au moins ${MIN_PASSWORD_LENGTH} caracteres.`)
  }

  const doc = {
    key: 'admin',
    email: DEFAULT_ADMIN_EMAIL,
    name: DEFAULT_ADMIN_NAME,
    passwordHash: hashServerPassword(initialPassword),
    mustChangePassword: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await db.collection('app_credentials').insertOne(doc)
  return doc
}

export async function GET() {
  return handleApi(async () => {
    const db = await getDb()
    const credential = await getCredential(db)

    return jsonOk({
      email: credential?.email || DEFAULT_ADMIN_EMAIL,
      name: credential?.name || DEFAULT_ADMIN_NAME,
    })
  })
}

export async function PUT(req: Request) {
  return handleApi(async () => {
    const db = await getDb()
    const body = await readJson(req)
    const currentPassword = String(body.currentPassword || '')
    const newPassword = String(body.newPassword || '')
    const nextEmail = String(body.email || '').trim().toLowerCase()
    const nextName = String(body.name || '').trim()
    const limited = rateLimitAuth(req, 'admin-password', nextEmail)
    if (limited) return limited

    if (!nextName) {
      return jsonError('Nom administrateur requis', 400)
    }

    if (!currentPassword) {
      return jsonError('Mot de passe actuel requis', 400)
    }

    if (nextEmail && !isValidEmail(nextEmail)) {
      return jsonError('Email administrateur invalide', 400)
    }

    if (newPassword && newPassword.length < MIN_PASSWORD_LENGTH) {
      return jsonError(`Minimum ${MIN_PASSWORD_LENGTH} caracteres`, 400)
    }

    const credentials = db.collection('app_credentials')
    const credential = await getOrCreateCredential(db)
    if (!credential) {
      return jsonError('Compte admin non initialise. Definis ADMIN_INITIAL_PASSWORD dans les variables serveur.', 500)
    }

    if (!verifyServerPassword(currentPassword, credential.passwordHash)) {
      return jsonError('Mot de passe actuel incorrect', 401)
    }

    const currentEmail = String(credential.email || DEFAULT_ADMIN_EMAIL).toLowerCase()
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (nextEmail && nextEmail !== currentEmail) {
      updates.email = nextEmail
    }

    if (nextName && nextName !== String(credential.name || DEFAULT_ADMIN_NAME)) {
      updates.name = nextName
    }

    if (newPassword) {
      updates.passwordHash = hashServerPassword(newPassword)
      updates.mustChangePassword = false
    }

    if (!updates.email && !updates.name && !updates.passwordHash) {
      return jsonError('Aucune modification a enregistrer', 400)
    }

    await credentials.updateOne({ key: 'admin' }, { $set: updates })

    const updatedEmail = String(updates.email || currentEmail)
    await createActivityLog(db, {
      action: 'settings_updated',
      entity: 'app_credentials',
      entityId: 'admin',
      actor: {
        id: 1,
        name: String(updates.name || credential.name || DEFAULT_ADMIN_NAME),
        email: updatedEmail,
        role: 'admin',
      },
      summary: updates.email && updates.passwordHash
        ? 'Email et mot de passe administrateur modifies'
        : updates.email
          ? 'Email administrateur modifie'
          : updates.name
            ? 'Nom administrateur modifie'
            : 'Mot de passe administrateur modifie',
      details: { emailChanged: Boolean(updates.email), nameChanged: Boolean(updates.name), passwordChanged: Boolean(updates.passwordHash) },
      request: req,
    })

    return jsonOk({ email: updatedEmail, name: String(updates.name || credential.name || DEFAULT_ADMIN_NAME) }, 'Compte administrateur mis a jour')
  })
}
