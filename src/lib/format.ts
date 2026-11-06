const TZ = 'Asia/Tbilisi'

const dtFmt = new Intl.DateTimeFormat('ru-RU', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})
const dtYearFmt = new Intl.DateTimeFormat('ru-RU', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const yearFmt = new Intl.DateTimeFormat('ru-RU', { timeZone: TZ, year: 'numeric' })

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const sameYear = yearFmt.format(d) === yearFmt.format(new Date())
  return (sameYear ? dtFmt : dtYearFmt).format(d)
}

// ---------- Цены ----------

export const PRICE_MAX = 100_000
const numFmt = new Intl.NumberFormat('ru-RU')

export function formatAmount(price: number | null): string {
  return price === null ? 'по договорённости' : `${numFmt.format(price)} ₾`
}

export function formatPrice(price: number | null): string {
  return price === null ? 'по договорённости' : `от ${formatAmount(price)}`
}

export function parsePriceInput(
  raw: string,
): { ok: true; value: number | null } | { ok: false; error: string } {
  const s = raw.replace(/[\s ₾]/g, '')
  if (s === '') return { ok: true, value: null }
  if (!/^\d+$/.test(s)) return { ok: false, error: 'Только целое число в ₾' }
  const n = Number(s)
  if (n > PRICE_MAX) return { ok: false, error: `Не больше ${numFmt.format(PRICE_MAX)} ₾` }
  return { ok: true, value: n }
}

// ---------- Пользователи ----------

const USER_NAMES: Record<string, string> = {
  max: 'Max',
  dima: 'Дима',
  ilya: 'Илья',
  import: 'импорт',
}

export function userName(login: string | null | undefined): string {
  if (!login) return '—'
  return USER_NAMES[login.toLowerCase()] ?? login
}

export const USERS = ['max', 'dima', 'ilya'] as const
