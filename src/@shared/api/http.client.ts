import { config } from '@shared/config/env.config'

export type ApiErrorDetail = { field: string; type: string }

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: ApiErrorDetail[]

  constructor(status: number, code: string, message: string, details: ApiErrorDetail[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export const NETWORK_ERROR_MESSAGE = 'Não foi possível conectar ao servidor. Verifique sua conexão.'
export const UNEXPECTED_ERROR_MESSAGE = 'Algo deu errado. Tente novamente.'

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean
  signal?: AbortSignal
}

type RefreshHandler = () => Promise<string | null>

let accessToken: string | null = null
let refreshHandler: RefreshHandler | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function setRefreshHandler(handler: RefreshHandler | null): void {
  refreshHandler = handler
}

async function send(
  path: string,
  options: RequestOptions,
  token: string | null,
): Promise<Response> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.auth !== false && token) headers.Authorization = `Bearer ${token}`
  try {
    return await fetch(`${config.apiBaseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: 'include',
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'network_error', NETWORK_ERROR_MESSAGE)
  }
}

export async function toApiError(response: Response): Promise<ApiError> {
  try {
    const data: unknown = await response.json()
    if (
      typeof data === 'object' &&
      data !== null &&
      'code' in data &&
      'message' in data &&
      typeof data.code === 'string' &&
      typeof data.message === 'string'
    ) {
      const details = 'details' in data && Array.isArray(data.details) ? data.details : []
      return new ApiError(response.status, data.code, data.message, details)
    }
  } catch {
    return new ApiError(response.status, 'unexpected_error', UNEXPECTED_ERROR_MESSAGE)
  }
  return new ApiError(response.status, 'unexpected_error', UNEXPECTED_ERROR_MESSAGE)
}

export async function request(path: string, options: RequestOptions = {}): Promise<Response> {
  let response = await send(path, options, accessToken)
  if (response.status === 401 && options.auth !== false && refreshHandler) {
    const token = await refreshHandler()
    if (token) response = await send(path, options, token)
  }
  if (!response.ok) throw await toApiError(response)
  return response
}

export async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await request(path, options)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
