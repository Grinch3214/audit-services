<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { ArrowLeft, RotateCw, Search, X } from '@lucide/vue'
import { isApiError, type ServiceCard as Card, type ServiceStatus } from '@/api'
import { STATUS, STATUS_FILTERS } from '@/lib/status'
import { useCategoryStore } from '@/stores/category'
import ServiceCard from '@/components/ServiceCard.vue'
import InlineAdd from '@/components/InlineAdd.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

const props = defineProps<{ id: number }>()

const store = useCategoryStore()
const { category } = storeToRefs(store)
const error = ref('')
const loading = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  try {
    await store.load(props.id)
  } catch (e) {
    error.value = isApiError(e) ? e.message : 'Не удалось загрузить категорию'
  } finally {
    loading.value = false
  }
}

watch(() => props.id, load, { immediate: true })

// ---------- Фильтры ----------

type Filter = 'all' | ServiceStatus
const filter = ref<Filter>('all')
const query = ref('')
// Карточки, которые трогали при текущем фильтре, не исчезают из-под пальца
const pinned = reactive(new Set<number>())
watch([filter, query, () => props.id], () => pinned.clear())

const services = computed(() => category.value?.services ?? [])

const counts = computed(() => {
  const c: Record<Filter, number> = { all: 0, unknown: 0, yes: 0, no: 0, planned: 0, ask: 0 }
  for (const s of services.value) {
    c.all++
    c[s.status]++
  }
  return c
})

const priceStats = computed(() => {
  let total = 0
  let confirmed = 0
  for (const s of services.value)
    for (const p of s.prices) {
      total++
      if (p.confirmed) confirmed++
    }
  return { total, confirmed }
})

const needle = computed(() => query.value.trim().toLowerCase())
const matches = (s: Card) =>
  (filter.value === 'all' || s.status === filter.value) &&
  (!needle.value ||
    s.title.toLowerCase().includes(needle.value) ||
    s.prices.some((p) => p.title.toLowerCase().includes(needle.value)))

const visible = computed(() => services.value.filter((s) => pinned.has(s.id) || matches(s)))

const filters = computed(() => [
  { code: 'all' as const, label: 'Все', dot: '' },
  ...STATUS_FILTERS.map((code) => ({
    code,
    label: code === 'unknown' ? 'Непроверенные' : STATUS[code].label,
    dot: STATUS[code].dot,
  })),
])

function resetFilters() {
  filter.value = 'all'
  query.value = ''
}

async function addService(title: string) {
  const ok = (await store.createService(title)) === 'ok'
  const last = services.value[services.value.length - 1]
  if (ok && last) pinned.add(last.id)
  return ok
}

const pct = (part: number, total: number) => (total ? (part / total) * 100 : 0)
</script>

<template>
  <div class="flex flex-col gap-4">
    <Button variant="ghost" size="sm" class="-ml-2 self-start" as-child>
      <RouterLink to="/"><ArrowLeft />Категории</RouterLink>
    </Button>

    <div
      v-if="error && !category"
      class="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center"
    >
      <p class="text-muted-foreground">{{ error }}</p>
      <Button variant="outline" :disabled="loading" @click="load">
        <RotateCw :class="{ 'animate-spin': loading }" />
        Повторить
      </Button>
    </div>

    <div
      v-else-if="category"
      class="flex flex-col gap-4 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-10"
    >
      <aside class="contents lg:sticky lg:top-22 lg:flex lg:flex-col lg:gap-5">
        <div class="flex flex-col gap-3">
          <h1 class="text-2xl font-semibold tracking-tight">{{ category.title }}</h1>
          <div class="text-muted-foreground flex flex-col gap-1.5 text-sm tabular-nums">
            <div class="flex justify-between">
              <span>Проверено</span>
              <span>
                <b class="text-foreground font-semibold">{{ counts.all - counts.unknown }}</b>
                / {{ counts.all }}
              </span>
            </div>
            <div class="bg-muted h-1.5 overflow-hidden rounded-full">
              <div
                class="bg-primary h-full rounded-full transition-all"
                :style="{ width: `${pct(counts.all - counts.unknown, counts.all)}%` }"
              />
            </div>
            <div class="flex justify-between">
              <span>Цены подтверждены</span>
              <span>
                <b class="text-foreground font-semibold">{{ priceStats.confirmed }}</b>
                / {{ priceStats.total }}
              </span>
            </div>
          </div>
        </div>

        <div
          class="bg-background/95 sticky top-14 z-30 -mx-4 flex flex-col gap-2 border-b px-4 py-2 backdrop-blur lg:static lg:m-0 lg:gap-3 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
        >
          <div class="relative">
            <Search
              class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              v-model="query"
              type="search"
              class="h-11 pr-9 pl-9 text-base"
              placeholder="Поиск в категории"
              aria-label="Поиск по услугам и позициям"
            />
            <button
              v-if="query"
              type="button"
              class="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md"
              aria-label="Очистить поиск"
              @click="query = ''"
            >
              <X class="size-4" />
            </button>
          </div>

          <div
            class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:m-0 lg:flex-wrap lg:overflow-visible lg:p-0"
            role="group"
            aria-label="Фильтр по статусу"
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
              <span v-if="f.dot" :class="['size-2 rounded-full', f.dot]" />
              {{ f.label }}
              <span class="tabular-nums opacity-70">{{ counts[f.code] }}</span>
            </button>
          </div>
        </div>
      </aside>

      <div class="flex flex-col gap-3">
        <ServiceCard v-for="s in visible" :key="s.id" :service="s" @interact="pinned.add(s.id)" />

        <div
          v-if="!visible.length"
          class="text-muted-foreground flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center text-sm"
        >
          <template v-if="services.length">
            Ничего не найдено
            <Button variant="outline" size="sm" @click="resetFilters">Сбросить фильтры</Button>
          </template>
          <template v-else>В категории пока нет услуг</template>
        </div>

        <InlineAdd label="Добавить услугу" placeholder="Название услуги" :submit="addService" />
      </div>
    </div>

    <div v-else class="flex flex-col gap-4 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
      <div class="flex flex-col gap-3">
        <Skeleton class="h-7 w-2/3" />
        <Skeleton class="h-1.5 w-full" />
        <Skeleton class="h-11 w-full" />
      </div>
      <div class="flex flex-col gap-3">
        <Skeleton v-for="i in 3" :key="i" class="h-64 w-full rounded-xl" />
      </div>
    </div>
  </div>
</template>
