import { http } from './http'
import type {
  Category,
  CategoryCreate,
  CategoryDetail,
  CategoryListItem,
  CategoryPatch,
  HistoryEntry,
  Price,
  PriceCreate,
  PricePatch,
  Service,
  ServiceCreate,
  ServicePatch,
} from './types'

export const categoriesApi = {
  list: (signal?: AbortSignal) => http.get<CategoryListItem[]>('/categories', { signal }),
  get: (id: number, signal?: AbortSignal) =>
    http.get<CategoryDetail>(`/categories/${id}`, { signal }),
  create: (body: CategoryCreate) => http.post<Category>('/categories', body),
  update: (id: number, body: CategoryPatch) => http.patch<Category>(`/categories/${id}`, body),
  remove: (id: number) => http.del<Category>(`/categories/${id}`),
  restore: (id: number) => http.post<Category>(`/categories/${id}/restore`),
}

export const servicesApi = {
  create: (body: ServiceCreate) => http.post<Service>('/services', body),
  update: (id: number, body: ServicePatch) => http.patch<Service>(`/services/${id}`, body),
  remove: (id: number) => http.del<Service>(`/services/${id}`),
  restore: (id: number) => http.post<Service>(`/services/${id}/restore`),
  history: (id: number, signal?: AbortSignal) =>
    http.get<HistoryEntry[]>(`/services/${id}/history`, { signal }),
}

export const pricesApi = {
  create: (body: PriceCreate) => http.post<Price>('/prices', body),
  update: (id: number, body: PricePatch) => http.patch<Price>(`/prices/${id}`, body),
  remove: (id: number) => http.del<Price>(`/prices/${id}`),
  restore: (id: number) => http.post<Price>(`/prices/${id}/restore`),
}
