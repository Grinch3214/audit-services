<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Loader2, RotateCcw, RotateCw, TriangleAlert } from '@lucide/vue'
import { toast } from 'vue-sonner'
import {
  categoriesApi,
  isApiError,
  pricesApi,
  servicesApi,
  trashApi,
  type Trash,
  type TrashKind,
} from '@/api'
import { formatDateTime, formatPrice, userName } from '@/lib/format'
import { useCatalogStore } from '@/stores/catalog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const router = useRouter()
const catalog = useCatalogStore()

const trash = ref<Trash | null>(null)
const error = ref('')
const loading = ref(false)
const busy = reactive(new Set<string>())
const filter = ref<'all' | TrashKind>('all')

async function load() {
  loading.value = true
  error.value = ''
  try {
    trash.value = await trashApi.get()
  } catch (e) {
    error.value = isApiError(e) ? e.message : 'Не удалось загрузить корзину'
  } finally {
    loading.value = false
  }
}
void load()

interface Row {
  kind: TrashKind
  id: number
  title: string
  meta?: string
  warning?: string
  deletedAt: string
  deletedBy: string
}

const KIND_LABEL: Record<TrashKind, string> = {
  categories: 'Категория',
  services: 'Услуга',
  prices: 'Позиция',
}

const rows = computed<Record<TrashKind, Row[]>>(() => {
  const t = trash.value
  if (!t) return { categories: [], services: [], prices: [] }
  const trashedCategories = new Set(t.categories.map((c) => c.title))
  const trashedServices = new Set(t.services.map((s) => s.title))
  const activeCategories = new Set(catalog.categories?.map((c) => c.title))
  return {
    categories: t.categories.map((c) => ({ kind: 'categories' as const, ...c })),
    services: t.services.map((s) => ({
      kind: 'services' as const,
      ...s,
      meta: `Категория: ${s.categoryTitle}`,
      warning:
        trashedCategories.has(s.categoryTitle) && !activeCategories.has(s.categoryTitle)
          ? 'Категория тоже в корзине — сначала верните её'
          : undefined,
    })),
    prices: t.prices.map((p) => ({
      kind: 'prices' as const,
      ...p,
      meta: `${p.serviceTitle} · ${formatPrice(p.priceFrom)}`,
      warning: trashedServices.has(p.serviceTitle)
        ? 'Услуга тоже в корзине — сначала верните её'
        : undefined,
    })),
  }
})

const counts = computed(() => ({
  categories: rows.value.categories.length,
  services: rows.value.services.length,
  prices: rows.value.prices.length,
}))
const total = computed(() => counts.value.categories + counts.value.services + counts.value.prices)

const visible = computed(() => {
  const all = [...rows.value.categories, ...rows.value.services, ...rows.value.prices]
  const list = filter.value === 'all' ? all : rows.value[filter.value]
  return [...list].sort((a, b) => b.deletedAt.localeCompare(a.deletedAt))
})

const filters = computed(() => [
  { code: 'all' as const, label: 'Всё', count: total.value },
  { code: 'categories' as const, label: 'Категории', count: counts.value.categories },
  { code: 'services' as const, label: 'Услуги', count: counts.value.services },
  { code: 'prices' as const, label: 'Позиции', count: counts.value.prices },
])

function drop(row: Row) {
  const t = trash.value
  if (!t) return
  const keep = (x: { id: number }) => x.id !== row.id
  if (row.kind === 'categories') t.categories = t.categories.filter(keep)
  else if (row.kind === 'services') t.services = t.services.filter(keep)
  else t.prices = t.prices.filter(keep)
}

const openCategory = (id: number) => router.push({ name: 'category', params: { id } })

async function restore(row: Row) {
  const key = `${row.kind}:${row.id}`
  if (busy.has(key)) return
  busy.add(key)
  try {
    let categoryId: number | null = null
    if (row.kind === 'categories') categoryId = (await categoriesApi.restore(row.id)).id
    else if (row.kind === 'services') categoryId = (await servicesApi.restore(row.id)).categoryId
    else await pricesApi.restore(row.id)
    drop(row)
    catalog.loadOverview().catch(() => {})
    toast.success(`${KIND_LABEL[row.kind]} «${row.title}» восстановлена`, {
      action:
        categoryId !== null
          ? { label: 'Открыть', onClick: () => openCategory(categoryId) }
          : undefined,
    })
  } catch (e) {
    toast.error(isApiError(e) ? e.message : 'Не удалось восстановить')
    if (isApiError(e) && e.status === 404) drop(row)
  } finally {
    busy.delete(key)
  }
}

if (!catalog.categories) catalog.loadOverview().catch(() => {})
</script>

<template>
  <div
    class="flex flex-col gap-4 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-10"
  >
    <aside class="flex flex-col gap-3 lg:sticky lg:top-22">
      <h1 class="text-2xl font-semibold tracking-tight">Корзина</h1>
      <p class="text-muted-foreground text-sm">
        Удалённое можно вернуть. Насовсем отсюда ничего не пропадает.
      </p>
      <div
        class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:m-0 lg:flex-wrap lg:p-0"
        role="group"
        aria-label="Что показывать"
      >
        <button
          v-for="f in filters"
          :key="f.code"
          type="button"
          :aria-pressed="filter === f.code"
          :class="[
            'flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium whitespace-nowrap transition-colors',
            filter === f.code
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
          ]"
          @click="filter = f.code"
        >
          {{ f.label }}
          <span class="tabular-nums opacity-70">{{ f.count }}</span>
        </button>
      </div>
    </aside>

    <div class="flex min-w-0 flex-col gap-3">
      <div
        v-if="error && !trash"
        class="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center"
      >
        <p class="text-muted-foreground text-sm">{{ error }}</p>
        <Button variant="outline" :disabled="loading" @click="load">
          <RotateCw :class="{ 'animate-spin': loading }" />
          Повторить
        </Button>
      </div>

      <div v-else-if="!trash" class="flex flex-col gap-2">
        <Skeleton v-for="i in 5" :key="i" class="h-20 w-full rounded-xl" />
      </div>

      <p
        v-else-if="!visible.length"
        class="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm"
      >
        {{ total ? 'В этом разделе пусто' : 'Корзина пуста' }}
      </p>

      <ul
        v-else
        class="bg-card ring-foreground/10 divide-y overflow-hidden rounded-xl shadow-xs ring-1"
      >
        <li
          v-for="r in visible"
          :key="`${r.kind}:${r.id}`"
          class="flex items-center gap-3 px-4 py-3"
        >
          <div class="flex min-w-0 flex-1 flex-col gap-0.5">
            <p class="text-muted-foreground text-xs">{{ KIND_LABEL[r.kind] }}</p>
            <p class="leading-snug font-medium break-words">{{ r.title }}</p>
            <p v-if="r.meta" class="text-muted-foreground text-sm break-words">{{ r.meta }}</p>
            <p
              v-if="r.warning"
              class="flex items-start gap-1 text-xs text-amber-700 dark:text-amber-400"
            >
              <TriangleAlert class="mt-px size-3.5 shrink-0" />{{ r.warning }}
            </p>
            <p class="text-muted-foreground text-xs tabular-nums">
              Удалено: {{ userName(r.deletedBy) }} · {{ formatDateTime(r.deletedAt) }}
            </p>
          </div>
          <Button
            variant="outline"
            class="h-10 shrink-0"
            :disabled="busy.has(`${r.kind}:${r.id}`)"
            @click="restore(r)"
          >
            <Loader2 v-if="busy.has(`${r.kind}:${r.id}`)" class="animate-spin" />
            <RotateCcw v-else />
            Вернуть
          </Button>
        </li>
      </ul>
    </div>
  </div>
</template>
