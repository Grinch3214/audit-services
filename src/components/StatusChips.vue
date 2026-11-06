<script setup lang="ts">
import type { ServiceStatus } from '@/api'
import { STATUS, STATUS_CHOICES } from '@/lib/status'

defineProps<{ status: ServiceStatus }>()
const emit = defineEmits<{ select: [code: ServiceStatus] }>()
</script>

<template>
  <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" role="group" aria-label="Статус">
    <button
      v-for="code in STATUS_CHOICES"
      :key="code"
      type="button"
      :aria-pressed="status === code"
      :class="[
        'h-10 rounded-full border px-4 text-sm font-medium transition-[color,background-color,border-color,transform] select-none active:scale-95',
        status === code
          ? STATUS[code].chip
          : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
      ]"
      @click="emit('select', code)"
    >
      {{ STATUS[code].label }}
    </button>
  </div>
</template>
