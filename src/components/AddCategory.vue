<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { Loader2, Plus } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { isApiError } from '@/api'
import { useCatalogStore } from '@/stores/catalog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const TITLE_MAX = 200

const catalog = useCatalogStore()
const open = ref(false)
const title = ref('')
const pending = ref(false)
const input = ref<InstanceType<typeof Input> | null>(null)

async function start() {
  open.value = true
  await nextTick()
  ;(input.value?.$el as HTMLInputElement | undefined)?.focus()
}

function cancel() {
  open.value = false
  title.value = ''
}

async function submit() {
  const value = title.value.trim()
  if (!value || pending.value) return
  if (value.length > TITLE_MAX) {
    toast.error(`Название — не длиннее ${TITLE_MAX} символов`)
    return
  }
  pending.value = true
  try {
    const created = await catalog.createCategory(value)
    toast.success(`Категория «${created.title}» добавлена`)
    cancel()
  } catch (e) {
    toast.error(isApiError(e) ? e.message : 'Не удалось добавить категорию')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <Button v-if="!open" variant="outline" size="lg" class="h-11 w-full border-dashed" @click="start">
    <Plus />
    Добавить категорию
  </Button>

  <form v-else class="flex gap-2" @submit.prevent="submit">
    <Input
      ref="input"
      v-model="title"
      class="h-11 flex-1 text-base"
      placeholder="Название категории"
      :maxlength="TITLE_MAX"
      :disabled="pending"
      @keydown.esc="cancel"
    />
    <Button type="submit" size="lg" class="h-11" :disabled="!title.trim() || pending">
      <Loader2 v-if="pending" class="animate-spin" />
      Добавить
    </Button>
    <Button type="button" variant="ghost" size="lg" class="h-11" @click="cancel">Отмена</Button>
  </form>
</template>
