const BASE = '/api'

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export class ConflictError<T = unknown> extends ApiError {
  readonly current: T

  constructor(message: string, current: T, body: unknown) {
    super(409, message, body)
    this.name = 'ConflictError'
    this.current = current
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError
export const isConflict = <T = unknown>(e: unknown): e is ConflictError<T> =>
  e instanceof ConflictError

// ---------- 401 ----------

let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn
}

// ---------- Запрос ----------

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'
type Query = Record<string, string | number | undefined | null>

export interface RequestOptions {
  body?: unknown
  query?: Query
  signal?: AbortSignal
  skipAuthHandler?: boolean
}

const STATUS_MESSAGES: Record<number, string> = {
  401: 'Нужно войти заново',
  404: 'Не найдено — возможно, уже удалено',
  409: 'Запись уже изменили — обновите данные',
  429: 'Слишком много попыток, подождите минуту',
}

function buildUrl(path: string, query?: Query) {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  }
  const s = qs.toString()
  return `${BASE}${path}${s ? `?${s}` : ''}`
}

const hasCyrillic = (s: string) => /[а-яё]/i.test(s)

/**
 * `message` у Nest — строка или массив причин (400).
 * Русские сообщения бэка («Неверный логин или пароль», «Уже изменил dima…») показываем как есть,
 * дефолтные английские («Unauthorized», «Not Found») — заменяем своими.
 */
function extractMessage(body: unknown, status: number): string {
  const fallback =
    STATUS_MESSAGES[status] ?? (status >= 500 ? 'Ошибка сервера' : `Ошибка ${status}`)
  const m = (body as { message?: unknown } | null)?.message
  if (Array.isArray(m) && m.length) return m.join('; ')
  if (typeof m === 'string' && m && (hasCyrillic(m) || !STATUS_MESSAGES[status])) return m
  return fallback
}

export async function request<T>(method: Method, path: string, opts: RequestOptions = {}) {
  const { body, query, signal, skipAuthHandler } = opts

  let res: Response
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new ApiError(0, 'Нет связи с сервером')
  }

  const text = res.status === 204 ? '' : await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (res.ok) return data as T

  const message = extractMessage(data, res.status)

  if (res.status === 409 && data && typeof data === 'object' && 'current' in data) {
    throw new ConflictError(message, (data as { current: unknown }).current, data)
  }
  if (res.status === 401 && !skipAuthHandler) onUnauthorized?.()

  throw new ApiError(res.status, message, data)
}

export const http = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'body'>) => request<T>('GET', path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('POST', path, { ...opts, body }),
  patch: <T>(path: string, body: unknown, opts?: RequestOptions) =>
    request<T>('PATCH', path, { ...opts, body }),
  del: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
}
