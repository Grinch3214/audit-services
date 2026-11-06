<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { Loader2, Plus } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const props = withDefaults(
  defineProps<{
    label: string
    placeholder: string
    submit: (title: string) => Promise<boolean>
    maxlength?: number
  }>(),
  { maxlength: 200 },
)

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

async function onSubmit() {
  const value = title.value.trim()
  if (!value || pending.value) return
  if (value.length > props.maxlength) {
    toast.error(`Название — не длиннее ${props.maxlength} символов`)
    return
  }
  pending.value = true
  try {
    if (await props.submit(value)) cancel()
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <Button v-if="!open" variant="outline" size="lg" class="h-11 w-full border-dashed" @click="start">
    <Plus />
    {{ label }}
  </Button>

  <form v-else class="flex flex-wrap gap-2" @submit.prevent="onSubmit">
    <Input
      ref="input"
      v-model="title"
      class="h-11 min-w-48 flex-1 text-base"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :disabled="pending"
      @keydown.esc="cancel"
    />
    <div class="flex gap-2">
      <Button type="submit" size="lg" class="h-11" :disabled="!title.trim() || pending">
        <Loader2 v-if="pending" class="animate-spin" />
        Добавить
      </Button>
      <Button type="button" variant="ghost" size="lg" class="h-11" @click="cancel">Отмена</Button>
    </div>
  </form>
</template>
