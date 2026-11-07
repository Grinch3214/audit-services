<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight } from '@lucide/vue'
import type { SearchResult } from '@/api'
import { formatPrice, plural } from '@/lib/format'
import { STATUS } from '@/lib/status'

const props = defineProps<{ results: SearchResult[]; query: string }>()

const needle = computed(() => props.query.trim().toLowerCase())

function parts(text: string) {
  const n = needle.value
  const out: { t: string; m: boolean }[] = []
  if (!n) return [{ t: text, m: false }]
  const lower = text.toLowerCase()
  let i = 0
  for (let at = lower.indexOf(n); at !== -1; at = lower.indexOf(n, i)) {
    if (at > i) out.push({ t: text.slice(i, at), m: false })
    out.push({ t: text.slice(at, at + n.length), m: true })
    i = at + n.length
  }
  if (i < text.length) out.push({ t: text.slice(i), m: false })
  return out
}

const rows = computed(() =>
  props.results.map((r) => ({
    r,
    matched: r.prices.filter((p) => p.title.toLowerCase().includes(needle.value)).slice(0, 3),
  })),
)
</script>

<template>
  <ul class="bg-card ring-foreground/10 divide-y overflow-hidden rounded-xl shadow-xs ring-1">
    <li v-for="{ r, matched } in rows" :key="r.id">
      <RouterLink
        :to="{ name: 'category', params: { id: r.category.id }, query: { service: r.id } }"
        class="hover:bg-muted/50 flex items-center gap-3 px-4 py-3 transition-colors"
      >
        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <p class="leading-snug font-medium break-words">
            <template v-for="(p, i) in parts(r.title)" :key="i">
              <mark
                v-if="p.m"
                class="rounded-sm bg-amber-200/70 text-inherit dark:bg-amber-500/30"
                >{{ p.t }}</mark
              >
              <template v-else>{{ p.t }}</template>
            </template>
          </p>
          <p class="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
            <span class="flex items-center gap-1">
              <span :class="['size-2 rounded-full', STATUS[r.status].dot]" />
              {{ STATUS[r.status].label }}
            </span>
            <span>· {{ r.category.title }}</span>
            <span>· {{ plural(r.prices.length, 'позиция', 'позиции', 'позиций') }}</span>
          </p>
          <ul v-if="matched.length" class="mt-1 flex flex-col gap-0.5 text-sm">
            <li v-for="p in matched" :key="p.id" class="flex gap-2">
              <span class="min-w-0 flex-1 break-words">
                <template v-for="(s, i) in parts(p.title)" :key="i">
                  <mark
                    v-if="s.m"
                    class="rounded-sm bg-amber-200/70 text-inherit dark:bg-amber-500/30"
                    >{{ s.t }}</mark
                  >
                  <template v-else>{{ s.t }}</template>
                </template>
              </span>
              <span class="text-muted-foreground shrink-0 tabular-nums">{{
                formatPrice(p.priceFrom)
              }}</span>
            </li>
          </ul>
        </div>
        <ChevronRight class="text-muted-foreground size-4 shrink-0" />
      </RouterLink>
    </li>
  </ul>
</template>
