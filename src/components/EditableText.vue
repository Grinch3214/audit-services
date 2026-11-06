<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { cn } from 'cn'

const props = withDefaults(
  defineProps<{
    value: string
    save: (value: string) => Promise<boolean>
    placeholder?: string
    multiline?: boolean
    maxlength?: number
    class?: string
    inputClass?: string
    label?: string
  }>(),
  { placeholder: '', multiline: false },
)

const editing = ref(false)
const pending = ref(false)
const draft = ref('')
const field = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)
let committing = false

async function start() {
  if (editing.value) return
  draft.value = props.value
  editing.value = true
  await nextTick()
  field.value?.focus()
  if (!props.multiline) field.value?.select()
}

function cancel() {
  editing.value = false
}

async function commit() {
  if (committing || !editing.value) return
  if (draft.value.trim() === props.value.trim()) return cancel()
  committing = true
  pending.value = true
  try {
    const ok = await props.save(draft.value)
    if (ok) editing.value = false
    else await nextTick(() => field.value?.focus())
  } finally {
    pending.value = false
    committing = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    cancel()
  } else if (e.key === 'Enter' && (!props.multiline || e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    void commit()
  }
}

defineExpose({ start })

const fieldClass =
  'w-full rounded-md border border-ring bg-background px-2 py-1 text-base outline-none ring-3 ring-ring/30 disabled:opacity-60'
</script>

<template>
  <div :class="cn('min-w-0', props.class)">
    <textarea
      v-if="editing && multiline"
      ref="field"
      v-model="draft"
      :aria-label="label"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :disabled="pending"
      :class="cn(fieldClass, 'field-sizing-content min-h-20 resize-none', inputClass)"
      @keydown="onKeydown"
      @blur="commit"
    />
    <input
      v-else-if="editing"
      ref="field"
      v-model="draft"
      :aria-label="label"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :disabled="pending"
      :class="cn(fieldClass, inputClass)"
      enterkeyhint="done"
      @keydown="onKeydown"
      @blur="commit"
    />
    <div
      v-else
      role="button"
      tabindex="0"
      :aria-label="label ? `${label}: изменить` : undefined"
      class="hover:bg-muted/60 -mx-1 rounded-md px-1 py-0.5 transition-colors"
      @click="start"
      @keydown.enter.prevent="start"
    >
      <slot>
        <span v-if="value" :class="multiline && 'whitespace-pre-line'">{{ value }}</span>
        <span v-else class="text-muted-foreground">{{ placeholder }}</span>
      </slot>
    </div>
  </div>
</template>
