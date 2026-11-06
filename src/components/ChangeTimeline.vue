<script setup lang="ts">
import { computed } from 'vue'
import type { ChangeView } from '@/lib/changes'
import { dayKey, formatDay, formatTime, userName } from '@/lib/format'

export interface TimelineItem {
  id: number
  at: string
  user: string
  view: ChangeView
  context?: string
}

const props = withDefaults(defineProps<{ items: TimelineItem[]; headerClass?: string }>(), {
  headerClass: 'bg-background top-0',
})

const groups = computed(() => {
  const out: { key: string; label: string; items: TimelineItem[] }[] = []
  for (const it of props.items) {
    const key = dayKey(it.at)
    let g = out[out.length - 1]
    if (!g || g.key !== key) out.push((g = { key, label: formatDay(it.at), items: [] }))
    g.items.push(it)
  }
  return out
})

const DOT: Record<ChangeView['tone'], string> = {
  create: 'bg-emerald-500',
  update: 'bg-primary',
  delete: 'bg-red-500',
  restore: 'bg-blue-500',
  import: 'bg-amber-500',
}
</script>

<template>
  <div class="flex flex-col">
    <section v-for="g in groups" :key="g.key" class="mb-4 last:mb-0">
      <h3 :class="['text-muted-foreground sticky z-10 py-1.5 text-xs font-medium', headerClass]">
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
              <span class="text-foreground font-medium">{{ userName(it.user) }}</span>
              · {{ formatTime(it.at) }}
            </p>
            <p class="text-sm leading-snug break-words">
              {{ it.view.text
              }}<template v-if="it.view.subject">
                «<span class="font-medium">{{ it.view.subject }}</span
                >»</template
              >
            </p>
            <p v-if="it.context" class="text-muted-foreground text-xs break-words">
              {{ it.context }}
            </p>
            <ul v-if="it.view.lines.length" class="flex flex-col gap-1 text-sm">
              <li
                v-for="(l, i) in it.view.lines"
                :key="i"
                :class="[
                  'min-w-0 leading-snug break-words',
                  l.long ? 'flex flex-col gap-0.5' : 'flex flex-wrap items-baseline gap-x-1.5',
                ]"
              >
                <span v-if="l.label" class="text-muted-foreground">{{ l.label }}:</span>
                <template v-if="l.from !== undefined">
                  <span class="text-muted-foreground line-through decoration-1">{{ l.from }}</span>
                  <span v-if="!l.long" class="text-muted-foreground" aria-hidden="true">→</span>
                </template>
                <span>{{ l.to }}</span>
              </li>
            </ul>
          </div>
        </li>
      </ol>
    </section>
  </div>
</template>
