import { API_BASE_URL } from './store'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface ApiResponse<T = any> {
  success?: boolean
  data?: T
  message?: string
  [key: string]: any
}

export async function apiCall<T = any>(endpoint: string, payload?: any, method: HttpMethod = 'GET'): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`
  const isJsonBody = payload !== undefined && !(payload instanceof FormData)

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  const init: RequestInit = {
    method,
    headers,
  }

  if (payload !== undefined) {
    if (payload instanceof FormData) {
      init.body = payload
    } else {
      headers['Content-Type'] = 'application/json'
      init.body = JSON.stringify(payload)
    }
  }

  const response = await fetch(url, init)
  const text = await response.text()

  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { message: text }
  }

  if (!response.ok) {
    throw new Error(data?.message || `API request failed (${response.status})`)
  }

  return data as ApiResponse<T>
}
