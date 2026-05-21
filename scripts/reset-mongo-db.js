const { MongoClient } = require('mongodb')
const fs = require('fs')
const path = require('path')

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const index = trimmed.indexOf('=')
    if (index === -1) continue

    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '')

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

loadLocalEnv()

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const dbName = process.env.MONGODB_DB || 'sk_parfumerie'

async function main() {
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db(dbName)

    await db.dropDatabase()
    await db.collection('app_status').insertOne({
      name: 'SK Parfumerie',
      database: dbName,
      createdAt: new Date(),
      status: 'ready',
    })

    console.log(`Base "${dbName}" supprimee puis recreee avec succes.`)
  } finally {
    await client.close()
  }
}

main().catch((error) => {
  console.error('Reset MongoDB impossible:', error.message)
  process.exit(1)
})
