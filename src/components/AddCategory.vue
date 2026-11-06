<script setup lang="ts">
import { toast } from 'vue-sonner'
import { isApiError } from '@/api'
import { useCatalogStore } from '@/stores/catalog'
import InlineAdd from './InlineAdd.vue'

const catalog = useCatalogStore()

async function submit(title: string) {
  try {
    const created = await catalog.createCategory(title)
    toast.success(`Категория «${created.title}» добавлена`)
    return true
  } catch (e) {
    toast.error(isApiError(e) ? e.message : 'Не удалось добавить категорию')
    return false
  }
}
</script>

<template>
  <InlineAdd label="Добавить категорию" placeholder="Название категории" :submit="submit" />
</template>
