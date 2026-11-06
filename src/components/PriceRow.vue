<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check } from '@lucide/vue'
import type { Price } from '@/api'
import { formatPrice } from '@/lib/format'
import { useCategoryStore } from '@/stores/category'
import PriceForm, { type PriceValues } from './PriceForm.vue'

const props = defineProps<{ price: Price }>()
const emit = defineEmits<{ interact: [] }>()
const store = useCategoryStore()
const editing = ref(false)
const hasMeta = computed(() => !!props.price.note || !props.price.confirmed)

function edit() {
  emit('interact')
  editing.value = true
}

async function save(v: PriceValues) {
  const p = props.price
  const patch: Partial<PriceValues> = {}
  if (v.title !== p.title) patch.title = v.title
  if (v.priceFrom !== p.priceFrom) patch.priceFrom = v.priceFrom
  if (v.note !== (p.note ?? null)) patch.note = v.note
  if (!Object.keys(patch).length) return true
  return (await store.updatePrice(p.serviceId, p.id, patch)) !== 'error'
}

async function remove() {
  if ((await store.deletePrice(props.price.serviceId, props.price.id)) === 'ok') {
    editing.value = false
  }
}

function toggleConfirmed() {
  emit('interact')
  void store.updatePrice(
    props.price.serviceId,
    props.price.id,
    { confirmed: !props.price.confirmed },
    { optimistic: true },
  )
}
</script>

<template>
  <li class="py-1">
    <PriceForm
      v-if="editing"
      :initial="price"
      submit-label="Сохранить"
      :submit="save"
      @cancel="editing = false"
      @delete="remove"
    />

    <div
      v-else
      class="grid min-h-12 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-2 sm:py-0.5"
    >
      <button
        type="button"
        class="hover:bg-muted/60 col-span-3 flex min-w-0 flex-col items-start rounded-md py-1 text-left transition-colors sm:col-span-1"
        :aria-label="`Изменить позицию «${price.title}»`"
        @click="edit"
      >
        <span :class="['leading-snug', !price.confirmed && 'text-muted-foreground']">
          {{ price.title }}
        </span>
        <span v-if="hasMeta" class="hidden flex-wrap gap-x-2 text-xs sm:flex">
          <span v-if="price.note" class="text-muted-foreground">{{ price.note }}</span>
          <span v-if="!price.confirmed" class="text-amber-600 dark:text-amber-400">с сайта</span>
        </span>
      </button>

      <span class="flex min-w-0 flex-wrap gap-x-2 text-xs sm:hidden" @click="edit">
        <span v-if="price.note" class="text-muted-foreground">{{ price.note }}</span>
        <span v-if="!price.confirmed" class="text-amber-600 dark:text-amber-400">с сайта</span>
      </span>

      <button
        type="button"
        :class="[
          'hover:bg-muted/60 rounded-md px-1 py-1 text-right whitespace-nowrap tabular-nums transition-colors',
          price.priceFrom === null ? 'text-muted-foreground text-sm' : 'font-semibold',
          !price.confirmed && 'opacity-60',
        ]"
        @click="edit"
      >
        {{ formatPrice(price.priceFrom) }}
      </button>

      <button
        type="button"
        :aria-pressed="price.confirmed"
        :title="price.confirmed ? 'Цена подтверждена — снять отметку' : 'Подтвердить цену с сайта'"
        :class="[
          'flex h-8 shrink-0 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors active:scale-95',
          price.confirmed
            ? 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            : 'border-dashed text-muted-foreground hover:bg-muted hover:text-foreground',
        ]"
        @click="toggleConfirmed"
      >
        <Check class="size-3.5" />
        <span>верно</span>
      </button>
    </div>
  </li>
</template>
