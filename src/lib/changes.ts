import type { AuditAction, AuditEntity, Changes, ServiceStatus } from '@/api/types'
import { formatPrice } from './format'
import { STATUS } from './status'

export interface ChangeLine {
  label: string
  from?: string
  to?: string
  long?: boolean
}

export interface ChangeView {
  text: string
  subject?: string
  lines: ChangeLine[]
  tone: AuditAction
}

interface Entry {
  entity: AuditEntity
  action: AuditAction
  changes: Changes
}

export interface ChangeContext {
  subject?: string | null
  categoryTitle?: (id: number) => string | undefined
}

const ENTITY_TEXT: Record<AuditEntity, Record<AuditAction, string>> = {
  category: {
    create: 'Категория создана',
    update: 'Категория изменена',
    delete: 'Категория удалена',
    restore: 'Категория восстановлена',
  },
  service: {
    create: 'Услуга создана',
    update: 'Услуга изменена',
    delete: 'Услуга удалена',
    restore: 'Услуга восстановлена',
  },
  price: {
    create: 'Позиция добавлена',
    update: 'Позиция изменена',
    delete: 'Позиция удалена',
    restore: 'Позиция восстановлена',
  },
}

const FIELD_ORDER = ['title', 'status', 'priceFrom', 'note', 'comment', 'categoryId'] as const
type Field = (typeof FIELD_ORDER)[number]

const LABELS: Record<Field, string> = {
  title: 'Название',
  status: 'Статус',
  priceFrom: 'Цена',
  note: 'Уточнение',
  comment: 'Заметка',
  categoryId: 'Категория',
}

const LONG: ReadonlySet<Field> = new Set(['comment', 'note'])

function formatValue(field: Field, v: unknown, ctx: ChangeContext): string {
  if (field === 'status') return STATUS[v as ServiceStatus]?.label ?? String(v)
  if (field === 'priceFrom') return formatPrice((v as number | null) ?? null)
  if (field === 'categoryId') {
    const id = Number(v)
    return ctx.categoryTitle?.(id) ?? `категория #${id}`
  }
  if (v === null || v === undefined || v === '') return 'пусто'
  return String(v)
}

export function describeChange(e: Entry, ctx: ChangeContext = {}): ChangeView {
  const c = e.changes
  const subject = ctx.subject ?? (str(c.title?.to) || str(c.title?.from) || undefined)
  const view: ChangeView = {
    text: ENTITY_TEXT[e.entity][e.action],
    subject,
    lines: [],
    tone: e.action,
  }

  if (e.action !== 'update') {
    if (e.entity === 'price' && e.action !== 'delete') {
      const snap = (f: string) => c[f]?.to
      const parts = [formatPrice((snap('priceFrom') as number | null) ?? null)]
      if (snap('note')) parts.push(String(snap('note')))
      view.lines.push({ label: '', to: parts.join(' · ') })
    }
    return view
  }

  for (const f of FIELD_ORDER) {
    const ch = c[f]
    if (!ch) continue
    view.lines.push({
      label: LABELS[f],
      from: formatValue(f, ch.from, ctx),
      to: formatValue(f, ch.to, ctx),
      long: LONG.has(f),
    })
  }

  if (c.confirmed) {
    const on = c.confirmed.to === true
    if (!view.lines.length) view.text = on ? 'Цена подтверждена' : 'Подтверждение снято'
    else if (on) view.lines.push({ label: '', to: 'цена подтверждена' })
  }

  if (!view.lines.length && !c.confirmed) {
    view.text = c.sort ? 'Изменён порядок' : view.text
  }

  return view
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')
