<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import { Button } from '@/components/ui/button'

defineProps<{ id: number }>()
</script>

<template>
  <div class="flex flex-col gap-4">
    <Button variant="ghost" size="sm" class="self-start" as-child>
      <RouterLink to="/"><ArrowLeft />Категории</RouterLink>
    </Button>
    <p class="text-muted-foreground">Категория #{{ id }} — экран в модуле 4.</p>
  </div>
</template>
