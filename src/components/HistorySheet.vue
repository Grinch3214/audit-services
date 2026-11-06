<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { RotateCw } from '@lucide/vue'
import { isApiError, servicesApi, type HistoryEntry } from '@/api'
import { describeChange } from '@/lib/changes'
import { useCatalogStore } from '@/stores/catalog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import ChangeTimeline, { type TimelineItem } from './ChangeTimeline.vue'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

const HISTORY_LIMIT = 200

const props = defineProps<{ serviceId: number; serviceTitle: string }>()
const open = defineModel<boolean>('open', { default: false })

const catalog = useCatalogStore()
const desktop = useMediaQuery('(min-width: 1024px)')

const entries = ref<HistoryEntry[] | null>(null)
const error = ref('')
const loading = ref(false)
let ctrl: AbortController | null = null

async function load() {
  ctrl?.abort()
  ctrl = new AbortController()
  const signal = ctrl.signal
  loading.value = true
  error.value = ''
  try {
    const [list] = await Promise.all([
      servicesApi.history(props.serviceId, signal),
      catalog.categories ? null : catalog.loadOverview().catch(() => null),
    ])
    entries.value = list
  } catch (e) {
    if (signal.aborted) return
    error.value = isApiError(e) ? e.message : 'Не удалось загрузить историю'
  } finally {
    if (!signal.aborted) loading.value = false
  }
}

watch(open, (v) => {
  if (v) void load()
  else ctrl?.abort()
})

const categoryTitle = (id: number) => catalog.categories?.find((c) => c.id === id)?.title

const items = computed<TimelineItem[]>(() =>
  (entries.value ?? []).map((e) => ({
    id: e.id,
    at: e.at,
    user: e.user,
    view: describeChange(e, { subject: e.entity === 'price' ? e.priceTitle : null, categoryTitle }),
  })),
)
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      :side="desktop ? 'right' : 'bottom'"
      :class="
        desktop
          ? 'w-full gap-0 sm:max-w-md'
          : 'max-h-[85dvh] gap-0 rounded-t-2xl pb-[env(safe-area-inset-bottom)]'
      "
    >
      <div v-if="!desktop" class="bg-muted mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full" />
      <SheetHeader class="border-b pr-12">
        <SheetTitle class="text-base">История</SheetTitle>
        <SheetDescription class="line-clamp-2">{{ serviceTitle }}</SheetDescription>
      </SheetHeader>

      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        <div v-if="error" class="flex flex-col items-center gap-3 py-8 text-center">
          <p class="text-muted-foreground text-sm">{{ error }}</p>
          <Button variant="outline" :disabled="loading" @click="load">
            <RotateCw :class="{ 'animate-spin': loading }" />
            Повторить
          </Button>
        </div>

        <div v-else-if="!entries" class="flex flex-col gap-4 py-2">
          <div v-for="i in 4" :key="i" class="flex flex-col gap-2">
            <Skeleton class="h-3 w-24" />
            <Skeleton class="h-4 w-3/4" />
          </div>
        </div>

        <p v-else-if="!entries.length" class="text-muted-foreground py-8 text-center text-sm">
          Изменений не было с импорта
        </p>

        <template v-else>
          <ChangeTimeline :items="items" header-class="bg-popover -top-3" />
          <p
            v-if="entries.length >= HISTORY_LIMIT"
            class="text-muted-foreground pt-2 text-center text-xs"
          >
            Показаны последние {{ HISTORY_LIMIT }} изменений
          </p>
        </template>
      </div>
    </SheetContent>
  </Sheet>
</template>
