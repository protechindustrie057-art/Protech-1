import { NextResponse } from 'next/server'
import { getMongoDb } from './mongodb'

export function jsonOk(data: unknown = null, message = 'OK', status = 200) {
  return NextResponse.json({ success: true, message, data }, { status })
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, message, data: null }, { status })
}

export async function readJson(req: Request) {
  try {
    return await req.json()
  } catch {
    return {}
  }
}

export async function getDb() {
  return await getMongoDb()
}

export async function handleApi(handler: () => Promise<ReturnType<typeof jsonOk | typeof jsonError>>) {
  try {
    return await handler()
  } catch (error: any) {
    console.error('API Error:', error)
    return jsonError(error.message || 'Erreur interne', 500)
  }
}