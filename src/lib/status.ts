// Статусы услуг: подписи и Tailwind-классы. Единственное место, где живут цвета статусов.

import type { ServiceStatus } from '@/api/types'

export interface StatusMeta {
  code: ServiceStatus
  label: string
  chip: string
  dot: string
}

export const STATUS: Record<ServiceStatus, StatusMeta> = {
  unknown: {
    code: 'unknown',
    label: 'Не проверено',
    chip: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-neutral-400',
  },
  yes: {
    code: 'yes',
    label: 'Делаем',
    chip: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  no: {
    code: 'no',
    label: 'Не делаем',
    chip: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
    dot: 'bg-red-500',
  },
  planned: {
    code: 'planned',
    label: 'Планируем',
    chip: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  ask: {
    code: 'ask',
    label: 'Уточнить',
    chip: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
}

export const STATUS_CHOICES: ServiceStatus[] = ['yes', 'no', 'planned', 'ask']

export const STATUS_FILTERS: ServiceStatus[] = ['unknown', 'yes', 'no', 'planned', 'ask']

export const nextStatus = (current: ServiceStatus, tapped: ServiceStatus): ServiceStatus =>
  current === tapped ? 'unknown' : tapped
