import { getDb, jsonError, jsonOk, readJson, handleApi } from '@/lib/apiServer'
import { createActivityLog } from '@/lib/activityLog'
import { hashServerPassword, MIN_PASSWORD_LENGTH, verifyServerPassword } from '@/lib/serverPassword'
import { rateLimitAuth } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@protechtouch.com'
const ADMIN_USER_BASE = {
  id: 1,
  name: 'Administrateur',
  role: 'admin' as const,
}

function canUseLocalAdminFallback() {
  return process.env.ENABLE_LOCAL_ADMIN_FALLBACK === 'true'
}

function authenticateLocalAdmin(email: string, password: string) {
  const fallbackPassword = process.env.ADMIN_INITIAL_PASSWORD
  const adminEmail = DEFAULT_ADMIN_EMAIL.toLowerCase()

  if (!canUseLocalAdminFallback() || !fallbackPassword) return null
  if (fallbackPassword.length < MIN_PASSWORD_LENGTH) return null
  if (email !== adminEmail || password !== fallbackPassword) return null

  return {
    ...ADMIN_USER_BASE,
    name: process.env.ADMIN_NAME || ADMIN_USER_BASE.name,
    email: adminEmail,
  }
}

async function getOrCreateAdminCredential(db: Awaited<ReturnType<typeof getDb>>) {
  const credentials = db.collection('app_credentials')
  const existing = await credentials.findOne<{ email?: string; name?: string; passwordHash: string }>({ key: 'admin' })
  if (existing) return existing

  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD
  if (!initialPassword) return null
  if (initialPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_INITIAL_PASSWORD doit contenir au moins ${MIN_PASSWORD_LENGTH} caracteres.`)
  }

  const doc = {
    key: 'admin',
    email: DEFAULT_ADMIN_EMAIL,
    name: process.env.ADMIN_NAME || ADMIN_USER_BASE.name,
    passwordHash: hashServerPassword(initialPassword),
    mustChangePassword: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await credentials.insertOne(doc)
  return doc
}

export async function POST(req: Request) {
  return handleApi(async () => {
    const body = await readJson(req)
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')

    if (!email || !password) return jsonError('Email et mot de passe requis', 400)
    const limited = rateLimitAuth(req, 'login', email)
    if (limited) return limited

    let db: Awaited<ReturnType<typeof getDb>>
    try {
      db = await getDb()
    } catch (error) {
      const localAdmin = authenticateLocalAdmin(email, password)
      if (localAdmin) return jsonOk({ user: localAdmin })
      throw error
    }

    const credential = await getOrCreateAdminCredential(db)
    if (!credential) {
      return jsonError('Compte admin non initialise. Definis ADMIN_INITIAL_PASSWORD dans les variables serveur.', 500)
    }

    const adminEmail = String(credential.email || DEFAULT_ADMIN_EMAIL).toLowerCase()
    if (email === adminEmail && verifyServerPassword(password, credential.passwordHash)) {
      const adminUser = {
        ...ADMIN_USER_BASE,
        name: String(credential.name || ADMIN_USER_BASE.name),
        email: adminEmail,
      }

      await createActivityLog(db, {
        action: 'login',
        entity: 'auth',
        actor: adminUser,
        summary: "Administrateur s'est connecte",
        request: req,
      })

      return jsonOk({ user: adminUser })
    }

    const appUser = await db.collection('users').findOne<any>({ email })
    if (!appUser || appUser.status === 'inactif' || !appUser.passwordHash) {
      return jsonError('Identifiants invalides', 401)
    }

    if (!verifyServerPassword(password, String(appUser.passwordHash))) {
      return jsonError('Identifiants invalides', 401)
    }

    const user = {
      id: Number(appUser.id),
      name: String(appUser.name || email),
      email: String(appUser.email),
      role: appUser.role,
      caisse_number: appUser.caisse_number ?? undefined,
      status: appUser.status || 'actif',
      last_login: new Date().toISOString(),
    }

    await db.collection('users').updateOne({ id: user.id }, { $set: { last_login: user.last_login, updatedAt: new Date() } })

    await createActivityLog(db, {
      action: 'login',
      entity: 'auth',
      actor: user,
      summary: `${user.name} s'est connecte`,
      request: req,
    })

    return jsonOk({ user })
  })
}
