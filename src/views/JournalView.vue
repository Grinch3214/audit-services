<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loader2, RotateCw } from '@lucide/vue'
import { auditApi, isApiError, isImportEntry, type AuditItem } from '@/api'
import { describeChange, describeImport } from '@/lib/changes'
import { USERS, userName } from '@/lib/format'
import { useCatalogStore } from '@/stores/catalog'
import ChangeTimeline, { type TimelineItem } from '@/components/ChangeTimeline.vue'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const PAGE = 50

const route = useRoute()
const router = useRouter()
const catalog = useCatalogStore()

const user = computed(() => {
  const u = route.query.user
  return typeof u === 'string' && (USERS as readonly string[]).includes(u) ? u : ''
})

function setUser(u: string) {
  void router.replace({ query: u ? { user: u } : {} })
}

const entries = ref<AuditItem[] | null>(null)
const cursor = ref<number | null>(null)
const loading = ref(false)
const error = ref('')
let ctrl: AbortController | null = null

async function fetchPage(reset: boolean) {
  ctrl?.abort()
  ctrl = new AbortController()
  const signal = ctrl.signal
  loading.value = true
  error.value = ''
  if (reset) {
    entries.value = null
    cursor.value = null
  }
  try {
    const page = await auditApi.list(
      { user: user.value || undefined, limit: PAGE, cursor: cursor.value ?? undefined },
      signal,
    )
    entries.value = reset ? page.items : [...(entries.value ?? []), ...page.items]
    cursor.value = page.nextCursor
  } catch (e) {
    if (signal.aborted) return
    error.value = isApiError(e) ? e.message : 'Не удалось загрузить журнал'
  } finally {
    if (!signal.aborted) loading.value = false
  }
}

watch(user, () => fetchPage(true), { immediate: true })
if (!catalog.categories) catalog.loadOverview().catch(() => {})

const categoryTitle = (id: number) => catalog.categories?.find((c) => c.id === id)?.title

const items = computed<TimelineItem[]>(() =>
  (entries.value ?? []).map((e) => {
    const base = { id: e.id, at: e.at, user: e.user }
    if (isImportEntry(e)) return { ...base, view: describeImport(e.changes.import.to) }
    const subject =
      e.entity === 'category'
        ? e.categoryTitle
        : e.entity === 'service'
          ? e.serviceTitle
          : e.priceTitle
    return {
      ...base,
      view: describeChange(e, { subject, categoryTitle }),
      context: e.entity === 'price' && e.serviceTitle ? `Услуга: ${e.serviceTitle}` : undefined,
    }
  }),
)

const filters = computed(() => [
  { code: '', label: 'Все' },
  ...USERS.map((u) => ({ code: u, label: userName(u) })),
])
</script>

<template>
  <div
    class="flex flex-col gap-4 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-10"
  >
    <aside class="flex flex-col gap-3 lg:sticky lg:top-22">
      <h1 class="text-2xl font-semibold tracking-tight">Журнал</h1>
      <p class="text-muted-foreground text-sm">Все изменения в каталоге, новые сверху.</p>
      <div class="flex flex-wrap gap-2" role="group" aria-label="Фильтр по пользователю">
        <button
          v-for="f in filters"
          :key="f.code"
          type="button"
          :aria-pressed="user === f.code"
          :class="[
            'flex h-9 items-center rounded-full border px-3.5 text-sm font-medium transition-colors',
            user === f.code
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
          ]"
          @click="setUser(f.code)"
        >
          {{ f.label }}
        </button>
      </div>
    </aside>

    <div class="flex min-w-0 flex-col gap-3">
      <div
        v-if="error && !entries?.length"
        class="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center"
      >
        <p class="text-muted-foreground text-sm">{{ error }}</p>
        <Button variant="outline" :disabled="loading" @click="fetchPage(true)">
          <RotateCw :class="{ 'animate-spin': loading }" />
          Повторить
        </Button>
      </div>

      <div v-else-if="!entries" class="flex flex-col gap-5">
        <div v-for="i in 6" :key="i" class="flex flex-col gap-2">
          <Skeleton class="h-3 w-24" />
          <Skeleton class="h-4 w-3/4" />
        </div>
      </div>

      <p
        v-else-if="!entries.length"
        class="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm"
      >
        {{ user ? 'У этого пользователя пока нет изменений' : 'Журнал пуст' }}
      </p>

      <template v-else>
        <ChangeTimeline :items="items" header-class="bg-background top-14 lg:top-14" />

        <p v-if="error" class="text-destructive text-center text-sm" role="alert">{{ error }}</p>
        <Button
          v-if="cursor !== null"
          variant="outline"
          class="h-11 self-stretch sm:self-center sm:px-8"
          :disabled="loading"
          @click="fetchPage(false)"
        >
          <Loader2 v-if="loading" class="animate-spin" />
          Ещё
        </Button>
        <p v-else class="text-muted-foreground py-2 text-center text-xs">Это всё</p>
      </template>
    </div>
  </div>
</template>
