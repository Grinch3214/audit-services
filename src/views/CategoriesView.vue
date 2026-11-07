<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { watchDebounced } from '@vueuse/core'
import { Loader2, RotateCw, Search, X } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { isApiError, searchApi, SEARCH_MAX, SEARCH_MIN, type SearchResult } from '@/api'
import { useCatalogStore } from '@/stores/catalog'
import ProgressSummary from '@/components/ProgressSummary.vue'
import CategoryRow from '@/components/CategoryRow.vue'
import AddCategory from '@/components/AddCategory.vue'
import ExportLink from '@/components/ExportLink.vue'
import SearchResults from '@/components/SearchResults.vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const catalog = useCatalogStore()
const { categories, progress } = storeToRefs(catalog)
const error = ref('')
const loading = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  try {
    await catalog.loadOverview()
  } catch (e) {
    error.value = isApiError(e) ? e.message : 'Не удалось загрузить категории'
    if (categories.value) toast.error(error.value)
  } finally {
    loading.value = false
  }
}

onMounted(load)

const route = useRoute()
const router = useRouter()
const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
const term = computed(() => query.value.trim())
const searching = computed(() => term.value.length >= SEARCH_MIN)
const results = ref<SearchResult[] | null>(null)
const searchError = ref('')
const searchLoading = ref(false)
let ctrl: AbortController | null = null

async function runSearch() {
  ctrl?.abort()
  searchError.value = ''
  if (!searching.value) return
  ctrl = new AbortController()
  const signal = ctrl.signal
  searchLoading.value = true
  try {
    results.value = await searchApi.search(term.value, signal)
  } catch (e) {
    if (signal.aborted) return
    searchError.value = isApiError(e) ? e.message : 'Поиск не удался'
  } finally {
    if (!signal.aborted) searchLoading.value = false
  }
}

watchDebounced(
  term,
  (q) => {
    void router.replace({ query: q ? { q } : {} })
    void runSearch()
  },
  { debounce: 300 },
)
watch(term, () => {
  if (!searching.value) {
    ctrl?.abort()
    results.value = null
    searchLoading.value = false
  }
})
if (searching.value) void runSearch()
</script>

<template>
  <div class="flex flex-col gap-6">
    <div
      v-if="error && !categories"
      class="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center"
    >
      <p class="text-muted-foreground">{{ error }}</p>
      <Button variant="outline" :disabled="loading" @click="load">
        <RotateCw :class="{ 'animate-spin': loading }" />
        Повторить
      </Button>
    </div>

    <div
      v-else-if="categories && progress"
      class="flex flex-col gap-6 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-10"
    >
      <aside class="flex flex-col gap-6 lg:sticky lg:top-22">
        <h1 class="text-2xl font-semibold tracking-tight">Категории</h1>
        <div class="relative">
          <Search
            class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <Input
            v-model="query"
            type="search"
            enterkeyhint="search"
            class="h-11 pr-9 pl-9 text-base"
            placeholder="Поиск по всем услугам"
            aria-label="Поиск по всем услугам и позициям"
            :maxlength="SEARCH_MAX"
          />
          <Loader2
            v-if="searchLoading"
            class="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin"
          />
          <button
            v-else-if="query"
            type="button"
            class="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md"
            aria-label="Очистить поиск"
            @click="query = ''"
          >
            <X class="size-4" />
          </button>
        </div>
        <ProgressSummary :class="{ 'hidden lg:flex': query }" :progress="progress" />
        <div class="hidden flex-col gap-4 lg:flex">
          <AddCategory />
          <ExportLink />
        </div>
      </aside>

      <div v-if="query" class="flex flex-col gap-3">
        <p v-if="!searching" class="text-muted-foreground p-6 text-center text-sm">
          Введите хотя бы {{ SEARCH_MIN }} символа
        </p>
        <div
          v-else-if="searchError"
          class="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center"
        >
          <p class="text-muted-foreground text-sm">{{ searchError }}</p>
          <Button variant="outline" @click="runSearch"><RotateCw />Повторить</Button>
        </div>
        <div v-else-if="!results" class="flex flex-col gap-2">
          <Skeleton v-for="i in 4" :key="i" class="h-16 w-full rounded-xl" />
        </div>
        <p
          v-else-if="!results.length"
          class="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm"
        >
          Ничего не нашлось по «{{ term }}»
        </p>
        <template v-else>
          <p class="text-muted-foreground px-1 text-xs">
            {{
              results.length >= 50
                ? 'Показаны первые 50 — уточните запрос'
                : `Найдено: ${results.length}`
            }}
          </p>
          <SearchResults :results="results" :query="term" />
        </template>
      </div>

      <div v-else class="flex flex-col gap-6">
        <div
          class="bg-card ring-foreground/10 divide-y overflow-hidden rounded-xl shadow-xs ring-1 lg:grid lg:grid-cols-2 lg:gap-3 lg:divide-y-0 lg:overflow-visible lg:rounded-none lg:bg-transparent lg:shadow-none lg:ring-0"
        >
          <CategoryRow v-for="c in categories" :key="c.id" :category="c" />
        </div>
        <p v-if="!categories.length" class="text-muted-foreground p-6 text-center text-sm">
          Категорий пока нет
        </p>
        <div class="flex flex-col gap-4 lg:hidden">
          <AddCategory />
          <ExportLink />
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col gap-6 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
      <div class="flex flex-col gap-3">
        <Skeleton class="h-7 w-1/2" />
        <Skeleton class="h-2.5 w-full" />
        <Skeleton class="h-4 w-2/3" />
      </div>
      <div class="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-3">
        <Skeleton v-for="i in 8" :key="i" class="h-20 w-full rounded-xl" />
      </div>
    </div>
  </div>
</template>
