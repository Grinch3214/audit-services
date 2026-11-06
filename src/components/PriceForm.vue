<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Loader2, Trash2 } from '@lucide/vue'
import { parsePriceInput } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface PriceValues {
  title: string
  priceFrom: number | null
  note: string | null
}

const props = defineProps<{
  initial?: PriceValues
  submitLabel: string
  submit: (values: PriceValues) => Promise<boolean>
}>()
const emit = defineEmits<{ cancel: []; delete: [] }>()

const title = ref(props.initial?.title ?? '')
const price = ref(props.initial?.priceFrom != null ? String(props.initial.priceFrom) : '')
const note = ref(props.initial?.note ?? '')
const pending = ref(false)
const error = ref('')
const titleInput = ref<InstanceType<typeof Input> | null>(null)

onMounted(() => (titleInput.value?.$el as HTMLInputElement | undefined)?.focus())

async function onSubmit() {
  if (pending.value) return
  const t = title.value.trim()
  if (!t) return void (error.value = 'Введите название')
  if (t.length > 200) return void (error.value = 'Название — не длиннее 200 символов')
  const parsed = parsePriceInput(price.value)
  if (!parsed.ok) return void (error.value = parsed.error)
  const n = note.value.trim()
  if (n.length > 500) return void (error.value = 'Уточнение — не длиннее 500 символов')

  error.value = ''
  pending.value = true
  try {
    if (await props.submit({ title: t, priceFrom: parsed.value, note: n || null })) emit('cancel')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <form
    class="bg-muted/40 flex flex-col gap-2 rounded-lg border p-3"
    @submit.prevent="onSubmit"
    @keydown.esc.prevent="emit('cancel')"
  >
    <Input
      ref="titleInput"
      v-model="title"
      class="h-10 text-base"
      placeholder="Название позиции"
      aria-label="Название позиции"
      :maxlength="200"
    />
    <div class="flex gap-2">
      <div class="relative w-32 shrink-0">
        <span
          class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm"
          >от</span
        >
        <Input
          v-model="price"
          class="h-10 pr-7 pl-8 text-right text-base tabular-nums"
          inputmode="numeric"
          placeholder="—"
          aria-label="Цена от, ₾"
        />
        <span
          class="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm"
          >₾</span
        >
      </div>
      <Input
        v-model="note"
        class="h-10 flex-1 text-base"
        placeholder="уточнение: за ось…"
        aria-label="Уточнение"
        :maxlength="500"
      />
    </div>
    <p class="text-muted-foreground text-xs">Пустая цена — «по договорённости»</p>
    <p v-if="error" role="alert" class="text-destructive text-sm">{{ error }}</p>

    <div class="flex items-center gap-2">
      <Button type="submit" :disabled="pending">
        <Loader2 v-if="pending" class="animate-spin" />
        {{ submitLabel }}
      </Button>
      <Button type="button" variant="ghost" @click="emit('cancel')">Отмена</Button>
      <Button
        v-if="initial"
        type="button"
        variant="destructive"
        size="icon"
        class="ml-auto"
        aria-label="Удалить позицию"
        @click="emit('delete')"
      >
        <Trash2 />
      </Button>
    </div>
  </form>
</template>
