import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  categoriesApi,
  progressApi,
  type Category,
  type CategoryListItem,
  type Progress,
} from '@/api'

export const useCatalogStore = defineStore('catalog', () => {
  const categories = ref<CategoryListItem[] | null>(null)
  const progress = ref<Progress | null>(null)

  async function loadOverview() {
    const [list, prog] = await Promise.all([categoriesApi.list(), progressApi.get()])
    categories.value = list
    progress.value = prog
  }

  async function createCategory(title: string): Promise<Category> {
    const created = await categoriesApi.create({ title })
    categories.value?.push({
      ...created,
      servicesTotal: 0,
      servicesChecked: 0,
      pricesTotal: 0,
      pricesConfirmed: 0,
    })
    return created
  }

  return { categories, progress, loadOverview, createCategory }
})
