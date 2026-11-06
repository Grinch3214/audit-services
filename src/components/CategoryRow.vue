<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight, CircleCheck } from '@lucide/vue'
import type { CategoryListItem } from '@/api'

const props = defineProps<{ category: CategoryListItem }>()

const c = computed(() => props.category)
const pct = (part: number, total: number) => (total ? (part / total) * 100 : 0)
const done = computed(
  () =>
    c.value.servicesTotal > 0 &&
    c.value.servicesChecked === c.value.servicesTotal &&
    c.value.pricesConfirmed === c.value.pricesTotal,
)
</script>

<template>
  <RouterLink
    :to="{ name: 'category', params: { id: c.id } }"
    class="hover:bg-muted/50 active:bg-muted flex items-center gap-3 px-4 py-3 transition-colors lg:bg-card lg:ring-foreground/10 lg:rounded-xl lg:py-4 lg:shadow-xs lg:ring-1 lg:hover:ring-foreground/25"
  >
    <div class="flex min-w-0 flex-1 flex-col gap-1.5">
      <div class="flex items-center gap-2">
        <span class="truncate font-medium">{{ c.title }}</span>
        <CircleCheck v-if="done" class="size-4 shrink-0 text-emerald-500" />
      </div>

      <div class="text-muted-foreground flex gap-4 text-xs tabular-nums">
        <span>
          Проверено
          <b class="text-foreground font-medium">{{ c.servicesChecked }}</b> / {{ c.servicesTotal }}
        </span>
        <span>
          Цены
          <b class="text-foreground font-medium">{{ c.pricesConfirmed }}</b> / {{ c.pricesTotal }}
        </span>
      </div>

      <div class="bg-muted h-1 w-full overflow-hidden rounded-full">
        <div
          class="bg-primary h-full rounded-full transition-all"
          :style="{ width: `${pct(c.servicesChecked, c.servicesTotal)}%` }"
        />
      </div>
    </div>
    <ChevronRight class="text-muted-foreground size-4 shrink-0" />
  </RouterLink>
</template>
