<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { RotateCw } from '@lucide/vue'
import { isApiError, servicesApi, type HistoryEntry } from '@/api'
import { describeChange, type ChangeView } from '@/lib/changes'
import { dayKey, formatDay, formatTime, userName } from '@/lib/format'
import { useCatalogStore } from '@/stores/catalog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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

interface Item {
  id: number
  user: string
  time: string
  view: ChangeView
}

const groups = computed(() => {
  const out: { key: string; label: string; items: Item[] }[] = []
  for (const e of entries.value ?? []) {
    const key = dayKey(e.at)
    let g = out[out.length - 1]
    if (!g || g.key !== key) out.push((g = { key, label: formatDay(e.at), items: [] }))
    g.items.push({
      id: e.id,
      user: userName(e.user),
      time: formatTime(e.at),
      view: describeChange(e, {
        subject: e.entity === 'price' ? e.priceTitle : null,
        categoryTitle,
      }),
    })
  }
  return out
})

const DOT: Record<ChangeView['tone'], string> = {
  create: 'bg-emerald-500',
  update: 'bg-primary',
  delete: 'bg-red-500',
  restore: 'bg-blue-500',
}
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
          <section v-for="g in groups" :key="g.key" class="mb-4 last:mb-0">
            <h3
              class="bg-popover text-muted-foreground sticky -top-3 z-10 py-1.5 text-xs font-medium"
            >
              {{ g.label }}
            </h3>
            <ol class="flex flex-col">
              <li
                v-for="it in g.items"
                :key="it.id"
                class="relative flex gap-3 pb-4 last:pb-1 [&:not(:last-child)]:before:absolute [&:not(:last-child)]:before:top-4 [&:not(:last-child)]:before:bottom-0 [&:not(:last-child)]:before:left-[3.5px] [&:not(:last-child)]:before:w-px [&:not(:last-child)]:before:bg-border"
              >
                <span :class="['mt-1.5 size-2 shrink-0 rounded-full', DOT[it.view.tone]]" />
                <div class="flex min-w-0 flex-1 flex-col gap-1">
                  <p class="text-muted-foreground text-xs tabular-nums">
                    <span class="text-foreground font-medium">{{ it.user }}</span> · {{ it.time }}
                  </p>
                  <p class="text-sm leading-snug">
                    {{ it.view.text
                    }}<template v-if="it.view.subject">
                      «<span class="font-medium">{{ it.view.subject }}</span
                      >»</template
                    >
                  </p>
                  <ul v-if="it.view.lines.length" class="flex flex-col gap-1 text-sm">
                    <li
                      v-for="(l, i) in it.view.lines"
                      :key="i"
                      :class="[
                        'min-w-0 leading-snug break-words',
                        l.long
                          ? 'flex flex-col gap-0.5'
                          : 'flex flex-wrap items-baseline gap-x-1.5',
                      ]"
                    >
                      <span v-if="l.label" class="text-muted-foreground">{{ l.label }}:</span>
                      <template v-if="l.from !== undefined">
                        <span class="text-muted-foreground line-through decoration-1">{{
                          l.from
                        }}</span>
                        <span v-if="!l.long" class="text-muted-foreground" aria-hidden="true"
                          >→</span
                        >
                      </template>
                      <span>{{ l.to }}</span>
                    </li>
                  </ul>
                </div>
              </li>
            </ol>
          </section>
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
