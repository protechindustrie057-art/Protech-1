import { MongoClient } from 'mongodb'

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

function getMongoUri() {
  const uri = process.env.MONGODB_URI?.trim().replace(/^["']|["']$/g, '')

  if (!uri) {
    throw new Error('MONGODB_URI est manquante. Verifie .env.local a la racine du projet.')
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error('MONGODB_URI invalide. La valeur doit commencer par mongodb:// ou mongodb+srv://.')
  }

  return uri
}

function getClientPromise() {
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(getMongoUri(), {
        tlsAllowInvalidCertificates: process.env.MONGODB_ALLOW_INVALID_CERTS === 'true',
        serverSelectionTimeoutMS: 5000,
      })

      global._mongoClientPromise = client.connect()
    }

    return global._mongoClientPromise
  }

  const client = new MongoClient(getMongoUri(), {
    tlsAllowInvalidCertificates: process.env.MONGODB_ALLOW_INVALID_CERTS === 'true',
    serverSelectionTimeoutMS: 5000,
  })

  return client.connect()
}

export async function getMongoDb() {
  const client = await getClientPromise()
  const dbName = process.env.MONGODB_DB || 'sk_parfumerie'
  return client.db(dbName)
}

export default getClientPromise
