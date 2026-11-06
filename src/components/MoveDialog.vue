<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Loader2 } from '@lucide/vue'
import { useCatalogStore } from '@/stores/catalog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const open = defineModel<boolean>('open', { required: true })
const props = defineProps<{ serviceTitle: string; currentCategoryId: number }>()
const emit = defineEmits<{ select: [id: number, title: string] }>()

const catalog = useCatalogStore()
const { categories } = storeToRefs(catalog)
const options = computed(() => categories.value?.filter((c) => c.id !== props.currentCategoryId))

watch(open, (v) => {
  if (v && !categories.value) void catalog.loadOverview().catch(() => {})
})

function pick(id: number, title: string) {
  open.value = false
  emit('select', id, title)
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="flex max-h-[85dvh] flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Перенести в категорию</DialogTitle>
        <DialogDescription>«{{ serviceTitle }}»</DialogDescription>
      </DialogHeader>
      <div v-if="!options" class="flex justify-center py-6">
        <Loader2 class="text-muted-foreground animate-spin" />
      </div>
      <ul v-else class="-mx-2 flex flex-col overflow-y-auto">
        <li v-for="c in options" :key="c.id">
          <button
            type="button"
            class="hover:bg-muted active:bg-muted flex min-h-11 w-full items-center rounded-md px-2 text-left text-base"
            @click="pick(c.id, c.title)"
          >
            {{ c.title }}
          </button>
        </li>
      </ul>
    </DialogContent>
  </Dialog>
</template>
