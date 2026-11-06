import { defineStore } from 'pinia'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import {
  categoriesApi,
  isApiError,
  isConflict,
  pricesApi,
  servicesApi,
  type CategoryDetail,
  type Price,
  type PriceCreate,
  type PricePatch,
  type Service,
  type ServiceCard,
  type ServicePatch,
} from '@/api'
import { useAuthStore } from './auth'

export type WriteResult = 'ok' | 'conflict' | 'error'

type Fields<T extends { version: number }> = Omit<T, 'version'>

export const useCategoryStore = defineStore('category', () => {
  const auth = useAuthStore()
  const category = ref<CategoryDetail | null>(null)

  // Записи по одной сущности строго по очереди: каждая берёт свежую version в момент отправки
  const queues = new Map<string, Promise<unknown>>()
  function enqueue<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const run = (queues.get(key) ?? Promise.resolve()).then(fn, fn)
    queues.set(
      key,
      run.catch(() => {}),
    )
    return run
  }

  async function load(id: number) {
    if (category.value?.id !== id) category.value = null
    const data = await categoriesApi.get(id)
    data.services.forEach(sortPrices)
    category.value = data
  }

  async function reload() {
    if (category.value) await load(category.value.id).catch(() => {})
  }

  const findService = (id: number) => category.value?.services.find((s) => s.id === id)
  const findPrice = (serviceId: number, priceId: number) =>
    findService(serviceId)?.prices.find((p) => p.id === priceId)

  function sortPrices(s: ServiceCard) {
    s.prices.sort((a, b) => a.sort - b.sort || a.id - b.id)
  }

  function touch(svc: ServiceCard, at: string) {
    svc.lastChange = { user: auth.user?.login ?? '', at }
  }

  function removeService(id: number) {
    if (!category.value) return
    category.value.services = category.value.services.filter((s) => s.id !== id)
  }

  function applyService(svc: ServiceCard, data: Service) {
    const { ...fields } = data as Service & Partial<Pick<ServiceCard, 'prices' | 'lastChange'>>
    delete fields.prices
    delete fields.lastChange
    Object.assign(svc, fields)
    if (data.deletedAt || data.categoryId !== category.value?.id) removeService(svc.id)
  }

  function applyPrice(svc: ServiceCard, price: Price, data: Price) {
    Object.assign(price, data)
    if (data.deletedAt) svc.prices = svc.prices.filter((p) => p.id !== price.id)
    else sortPrices(svc)
  }

  function fail(e: unknown, fallback: string): WriteResult {
    if (isConflict(e)) {
      toast.warning(e.message)
      return 'conflict'
    }
    toast.error(isApiError(e) ? e.message : fallback)
    if (isApiError(e) && e.status === 404) void reload()
    return 'error'
  }

  function snapshot<T extends object>(obj: T, keys: (keyof T)[]): Partial<T> {
    return Object.fromEntries(keys.map((k) => [k, obj[k]])) as Partial<T>
  }

  // ---------- Услуги ----------

  async function updateService(
    id: number,
    patch: Partial<Fields<ServicePatch>>,
    { optimistic = false } = {},
  ): Promise<WriteResult> {
    const svc = findService(id)
    if (!svc) return 'error'
    const keys = Object.keys(patch) as (keyof ServiceCard)[]
    const before = snapshot(svc, keys)
    if (optimistic) Object.assign(svc, patch)

    return enqueue(`service:${id}`, async () => {
      try {
        const res = await servicesApi.update(id, { ...patch, version: svc.version })
        applyService(svc, res)
        touch(svc, res.updatedAt)
        return 'ok'
      } catch (e) {
        if (isConflict<Service>(e)) applyService(svc, e.current)
        else if (optimistic) Object.assign(svc, before)
        return fail(e, 'Не удалось сохранить услугу')
      }
    })
  }

  async function createService(title: string): Promise<WriteResult> {
    const cat = category.value
    if (!cat) return 'error'
    try {
      const res = await servicesApi.create({ categoryId: cat.id, title })
      cat.services.push({ ...res, prices: [], lastChange: null })
      touch(cat.services[cat.services.length - 1]!, res.updatedAt)
      return 'ok'
    } catch (e) {
      return fail(e, 'Не удалось добавить услугу')
    }
  }

  async function deleteService(id: number): Promise<WriteResult> {
    const svc = findService(id)
    if (!svc) return 'error'
    try {
      await enqueue(`service:${id}`, () => servicesApi.remove(id))
      removeService(id)
      toast(`Услуга «${svc.title}» удалена`, {
        action: { label: 'Вернуть', onClick: () => void restoreService(id) },
      })
      return 'ok'
    } catch (e) {
      return fail(e, 'Не удалось удалить услугу')
    }
  }

  async function restoreService(id: number) {
    try {
      await servicesApi.restore(id)
      await reload()
      toast.success('Услуга восстановлена')
    } catch (e) {
      fail(e, 'Не удалось восстановить услугу')
    }
  }

  // ---------- Позиции ----------

  async function updatePrice(
    serviceId: number,
    priceId: number,
    patch: Partial<Fields<PricePatch>>,
    { optimistic = false } = {},
  ): Promise<WriteResult> {
    const svc = findService(serviceId)
    const price = findPrice(serviceId, priceId)
    if (!svc || !price) return 'error'
    const keys = Object.keys(patch) as (keyof Price)[]
    const before = snapshot(price, keys)
    if (optimistic) Object.assign(price, patch)

    return enqueue(`price:${priceId}`, async () => {
      try {
        const res = await pricesApi.update(priceId, { ...patch, version: price.version })
        applyPrice(svc, price, res)
        touch(svc, res.updatedAt)
        return 'ok'
      } catch (e) {
        if (isConflict<Price>(e)) applyPrice(svc, price, e.current)
        else if (optimistic) Object.assign(price, before)
        return fail(e, 'Не удалось сохранить позицию')
      }
    })
  }

  async function createPrice(body: PriceCreate): Promise<WriteResult> {
    const svc = findService(body.serviceId)
    if (!svc) return 'error'
    try {
      const res = await pricesApi.create(body)
      svc.prices.push(res)
      sortPrices(svc)
      touch(svc, res.updatedAt)
      return 'ok'
    } catch (e) {
      return fail(e, 'Не удалось добавить позицию')
    }
  }

  async function deletePrice(serviceId: number, priceId: number): Promise<WriteResult> {
    const svc = findService(serviceId)
    const price = findPrice(serviceId, priceId)
    if (!svc || !price) return 'error'
    try {
      const res = await enqueue(`price:${priceId}`, () => pricesApi.remove(priceId))
      svc.prices = svc.prices.filter((p) => p.id !== priceId)
      touch(svc, res.deletedAt ?? res.updatedAt)
      toast(`Позиция «${price.title}» удалена`, {
        action: { label: 'Вернуть', onClick: () => void restorePrice(serviceId, priceId) },
      })
      return 'ok'
    } catch (e) {
      return fail(e, 'Не удалось удалить позицию')
    }
  }

  async function restorePrice(serviceId: number, priceId: number) {
    try {
      const res = await pricesApi.restore(priceId)
      const svc = findService(serviceId)
      if (svc && !svc.prices.some((p) => p.id === res.id)) {
        svc.prices.push(res)
        sortPrices(svc)
        touch(svc, res.updatedAt)
      }
      toast.success('Позиция восстановлена')
    } catch (e) {
      fail(e, 'Не удалось восстановить позицию')
    }
  }

  return {
    category,
    load,
    reload,
    updateService,
    createService,
    deleteService,
    updatePrice,
    createPrice,
    deletePrice,
  }
})
