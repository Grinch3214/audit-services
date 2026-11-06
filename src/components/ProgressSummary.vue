<script setup lang="ts">
import { computed } from 'vue'
import type { Progress } from '@/api'
import { STATUS, STATUS_CHOICES } from '@/lib/status'
import { Progress as ProgressBar } from '@/components/ui/progress'

const props = defineProps<{ progress: Progress }>()

const services = computed(() => props.progress.services)
const prices = computed(() => props.progress.prices)
const pct = (part: number, total: number) => (total ? (part / total) * 100 : 0)

const segments = computed(() =>
  STATUS_CHOICES.map((code) => ({
    ...STATUS[code],
    count: services.value.byStatus[code] ?? 0,
  })).filter((s) => s.count > 0),
)
</script>

<template>
  <section class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <div class="flex items-baseline justify-between">
        <span class="text-muted-foreground text-sm">Проверено услуг</span>
        <span class="tabular-nums">
          <span class="text-2xl font-semibold tracking-tight">{{ services.checked }}</span>
          <span class="text-muted-foreground"> / {{ services.total }}</span>
        </span>
      </div>

      <div class="bg-muted flex h-2.5 w-full overflow-hidden rounded-full">
        <div
          v-for="s in segments"
          :key="s.code"
          :class="['h-full transition-all', s.dot]"
          :style="{ width: `${pct(s.count, services.total)}%` }"
        />
      </div>

      <ul class="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <li v-for="s in segments" :key="s.code" class="flex items-center gap-1.5">
          <span :class="['size-2 rounded-full', s.dot]" />
          {{ s.label }} <span class="text-foreground tabular-nums">{{ s.count }}</span>
        </li>
      </ul>
    </div>

    <div class="flex flex-col gap-2">
      <div class="flex items-baseline justify-between text-sm">
        <span class="text-muted-foreground">Цены подтверждены</span>
        <span class="tabular-nums">
          <span class="font-semibold">{{ prices.confirmed }}</span>
          <span class="text-muted-foreground"> / {{ prices.total }}</span>
        </span>
      </div>
      <ProgressBar :model-value="pct(prices.confirmed, prices.total)" />
    </div>
  </section>
</template>
