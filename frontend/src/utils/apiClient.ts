import { API_BASE_URL } from '@/config/api'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

type ApiRequestOptions = {
  method?: string
  headers?: Record<string, string>
  body?: unknown
  signal?: AbortSignal
}

export const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback

export const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const { method = 'GET', headers, body, signal } = options
  const finalHeaders: Record<string, string> = { ...(headers ?? {}) }

  if (body !== undefined && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })

  if (!response.ok) {
    let message = 'Request failed'
    try {
      const data = await response.json()
      if (data && typeof data.message === 'string') {
        message = data.message
      }
    } catch {
      // Ignore body parse errors for non-JSON responses.
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) {
    return undefined as T
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return undefined as T
  }
}
