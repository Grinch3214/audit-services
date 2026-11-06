<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { RotateCw } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { isApiError } from '@/api'
import { useCatalogStore } from '@/stores/catalog'
import ProgressSummary from '@/components/ProgressSummary.vue'
import CategoryRow from '@/components/CategoryRow.vue'
import AddCategory from '@/components/AddCategory.vue'
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
        <ProgressSummary :progress="progress" />
        <div class="hidden lg:block"><AddCategory /></div>
      </aside>

      <div class="flex flex-col gap-6">
        <div
          class="bg-card ring-foreground/10 divide-y overflow-hidden rounded-xl shadow-xs ring-1 lg:grid lg:grid-cols-2 lg:gap-3 lg:divide-y-0 lg:overflow-visible lg:rounded-none lg:bg-transparent lg:shadow-none lg:ring-0"
        >
          <CategoryRow v-for="c in categories" :key="c.id" :category="c" />
        </div>
        <p v-if="!categories.length" class="text-muted-foreground p-6 text-center text-sm">
          Категорий пока нет
        </p>
        <div class="lg:hidden"><AddCategory /></div>
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
