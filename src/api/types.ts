export type IsoDate = string

// ---------- Auth ----------

export interface User {
  id: number
  login: string
  name: string
}

export interface LoginBody {
  login: string
  password: string
}

// ---------- Общие поля сущностей ----------

interface Versioned {
  id: number
  sort: number
  version: number
  updatedAt: IsoDate
  updatedBy: string
  deletedAt: IsoDate | null
}

// ---------- Категории ----------

export interface Category extends Versioned {
  slug: string
  title: string
}

export interface CategoryListItem extends Category {
  servicesTotal: number
  servicesChecked: number
  pricesTotal: number
  pricesConfirmed: number
}

/** `GET /api/categories/:id` — всё для экрана категории */
export interface CategoryDetail extends Category {
  services: ServiceCard[]
}

export interface CategoryCreate {
  title: string
}

export interface CategoryPatch {
  version: number
  title?: string
  sort?: number
}

// ---------- Услуги ----------

export type ServiceStatus = 'unknown' | 'yes' | 'no' | 'planned' | 'ask'

export interface Service extends Versioned {
  categoryId: number
  slug: string
  title: string
  status: ServiceStatus
  comment: string | null
}

export interface LastChange {
  user: string
  at: IsoDate
}

export interface ServiceCard extends Service {
  prices: Price[]
  lastChange: LastChange | null
}

export interface ServiceCreate {
  categoryId: number
  title: string
}

export interface ServicePatch {
  version: number
  title?: string
  status?: ServiceStatus
  comment?: string | null
  categoryId?: number
  sort?: number
}

// ---------- Позиции цен ----------

export interface Price extends Versioned {
  serviceId: number
  title: string
  priceFrom: number | null
  note: string | null
  confirmed: boolean
}

export interface PriceCreate {
  serviceId: number
  title: string
  priceFrom?: number | null
  note?: string | null
}

export interface PricePatch {
  version: number
  title?: string
  priceFrom?: number | null
  note?: string | null
  confirmed?: boolean
  sort?: number
}

// ---------- Прогресс / поиск ----------

export interface Progress {
  services: {
    total: number
    checked: number
    byStatus: Record<ServiceStatus, number>
  }
  prices: {
    total: number
    confirmed: number
  }
}

export interface SearchResult extends ServiceCard {
  category: { id: number; title: string }
}

// ---------- Журнал / история ----------

export type AuditEntity = 'category' | 'service' | 'price'
export type AuditAction = 'create' | 'update' | 'delete' | 'restore'

export interface FieldChange {
  from?: unknown
  to?: unknown
}

export type Changes = Record<string, FieldChange>

export interface ImportSummary {
  source: string
  categories: number
  services: number
  prices: number
}

export const isImportEntry = (
  e: Pick<AuditBase, 'user' | 'entity' | 'entityId' | 'changes'>,
): e is AuditBase & { changes: { import: { to: ImportSummary } } } =>
  e.user === 'import' && e.entity === 'category' && e.entityId === 0 && 'import' in e.changes

interface AuditBase {
  id: number
  at: IsoDate
  user: string
  entity: AuditEntity
  entityId: number
  action: AuditAction
  changes: Changes
}

/** `GET /api/services/:id/history` */
export interface HistoryEntry extends AuditBase {
  priceTitle: string | null
}

/** Элемент `GET /api/audit` — текущие названия по типу записи */
export interface AuditItem extends AuditBase {
  categoryTitle: string | null
  serviceTitle: string | null
  priceTitle: string | null
}

export interface AuditPage {
  items: AuditItem[]
  nextCursor: number | null
}

export interface AuditQuery {
  user?: string
  limit?: number
  cursor?: number
}

// ---------- Корзина ----------

interface TrashBase {
  id: number
  title: string
  deletedAt: IsoDate
  deletedBy: string
}

export interface Trash {
  categories: TrashBase[]
  services: (TrashBase & { categoryTitle: string })[]
  prices: (TrashBase & { priceFrom: number | null; serviceTitle: string })[]
}

export type TrashKind = 'categories' | 'services' | 'prices'
