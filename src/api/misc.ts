// Прогресс, поиск, корзина, журнал, экспорт.

import { http } from './http'
import type { AuditPage, AuditQuery, Progress, SearchResult, Trash } from './types'

export const SEARCH_MIN = 2
export const SEARCH_MAX = 100

export const progressApi = {
  get: (signal?: AbortSignal) => http.get<Progress>('/progress', { signal }),
}

export const searchApi = {
  search: (q: string, signal?: AbortSignal) =>
    http.get<SearchResult[]>('/search', { query: { q: q.trim() }, signal }),
}

export const trashApi = {
  get: (signal?: AbortSignal) => http.get<Trash>('/trash', { signal }),
}

export const auditApi = {
  list: (query: AuditQuery = {}, signal?: AbortSignal) =>
    http.get<AuditPage>('/audit', { query: { ...query }, signal }),
}

export const EXPORT_URL = '/api/export'
