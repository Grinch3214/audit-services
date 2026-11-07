<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import {
  ArrowRightLeft,
  ChevronRight,
  Ellipsis,
  History,
  Plus,
  StickyNote,
  Trash2,
} from '@lucide/vue'
import { toast } from 'vue-sonner'
import type { ServiceCard, ServiceStatus } from '@/api'
import { formatDateTime, userName } from '@/lib/format'
import { nextStatus } from '@/lib/status'
import { useCategoryStore } from '@/stores/category'
import { confirm } from '@/composables/useConfirm'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import EditableText from './EditableText.vue'
import StatusChips from './StatusChips.vue'
import PriceRow from './PriceRow.vue'
import PriceForm, { type PriceValues } from './PriceForm.vue'
import MoveDialog from './MoveDialog.vue'
import HistorySheet from './HistorySheet.vue'

const props = defineProps<{ service: ServiceCard }>()
const emit = defineEmits<{ interact: [] }>()
const store = useCategoryStore()

const s = computed(() => props.service)
const showComment = ref(false)
const addingPrice = ref(false)
const moveOpen = ref(false)
const historyOpen = ref(false)
const commentEditor = ref<InstanceType<typeof EditableText> | null>(null)

const confirmedCount = computed(() => s.value.prices.filter((p) => p.confirmed).length)

async function saveTitle(v: string) {
  const title = v.trim()
  if (!title || title.length > 200) {
    toast.error(title ? 'Не длиннее 200 символов' : 'Название не может быть пустым')
    return false
  }
  emit('interact')
  return (await store.updateService(s.value.id, { title })) !== 'error'
}

async function saveComment(v: string) {
  const comment = v.trim()
  if (comment.length > 5000) {
    toast.error('Не длиннее 5000 символов')
    return false
  }
  emit('interact')
  const ok = (await store.updateService(s.value.id, { comment: comment || null })) !== 'error'
  if (ok && !comment) showComment.value = false
  return ok
}

async function openComment() {
  showComment.value = true
  await nextTick()
  commentEditor.value?.start()
}

function setStatus(code: ServiceStatus) {
  emit('interact')
  const status = nextStatus(s.value.status, code)
  void store.updateService(s.value.id, { status }, { optimistic: true })
  if (status === 'ask' && !s.value.comment) void openComment()
}

async function addPrice(v: PriceValues) {
  emit('interact')
  return (await store.createPrice({ serviceId: s.value.id, ...v })) === 'ok'
}

async function removeService() {
  const n = s.value.prices.length
  const ok = await confirm({
    title: 'Удалить услугу?',
    description: `«${s.value.title}»${n ? ` вместе с позициями (${n})` : ''}. Вернуть можно из корзины.`,
    confirmLabel: 'Удалить услугу',
  })
  if (ok) void store.deleteService(s.value.id)
}

async function move(categoryId: number, title: string) {
  if ((await store.updateService(s.value.id, { categoryId })) === 'ok') {
    toast.success(`Перенесено в «${title}»`)
  }
}
</script>

<template>
  <article
    :id="`service-${s.id}`"
    class="bg-card ring-foreground/10 flex scroll-mt-48 flex-col gap-4 rounded-xl p-4 shadow-xs ring-1 transition-shadow duration-700 lg:scroll-mt-24"
  >
    <header class="flex items-start gap-2">
      <EditableText
        class="flex-1 pt-1"
        input-class="font-semibold"
        label="Название услуги"
        :value="s.title"
        :maxlength="200"
        :save="saveTitle"
      >
        <h2 class="text-base leading-snug font-semibold">{{ s.title }}</h2>
      </EditableText>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" aria-label="Действия с услугой" class="-mt-1 -mr-2">
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          class="min-w-52"
          @close-auto-focus="(e: Event) => e.preventDefault()"
        >
          <DropdownMenuItem class="py-2.5" @select="moveOpen = true">
            <ArrowRightLeft />Перенести в категорию…
          </DropdownMenuItem>
          <DropdownMenuItem v-if="!s.comment && !showComment" class="py-2.5" @select="openComment">
            <StickyNote />Заметка для сайта
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" class="py-2.5" @select="removeService">
            <Trash2 />Удалить услугу
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>

    <StatusChips :status="s.status" @select="setStatus" />

    <section v-if="s.comment || showComment" class="bg-muted/60 rounded-lg px-3 py-2">
      <p class="text-muted-foreground mb-1 text-xs font-medium">Заметки для сайта</p>
      <EditableText
        ref="commentEditor"
        multiline
        class="text-sm"
        label="Заметки для сайта"
        placeholder="Ограничения, уточнения, вопросы…"
        :value="s.comment ?? ''"
        :maxlength="5000"
        :save="saveComment"
      />
    </section>

    <section class="flex flex-col">
      <div class="text-muted-foreground mb-1 flex items-center justify-between text-xs">
        <span class="font-medium">Позиции</span>
        <span v-if="s.prices.length" class="tabular-nums">
          подтверждено {{ confirmedCount }} / {{ s.prices.length }}
        </span>
      </div>
      <ul class="divide-y">
        <PriceRow v-for="p in s.prices" :key="p.id" :price="p" @interact="emit('interact')" />
      </ul>
      <p v-if="!s.prices.length && !addingPrice" class="text-muted-foreground py-2 text-sm">
        Позиций нет
      </p>

      <PriceForm
        v-if="addingPrice"
        class="mt-2"
        submit-label="Добавить"
        :submit="addPrice"
        @cancel="addingPrice = false"
      />
      <Button
        v-else
        variant="ghost"
        size="sm"
        class="text-muted-foreground mt-1 self-start"
        @click="addingPrice = true"
      >
        <Plus />позиция
      </Button>
    </section>

    <footer class="text-muted-foreground -mx-2 -mb-2 border-t pt-1 text-xs">
      <button
        v-if="s.lastChange"
        type="button"
        class="hover:bg-muted/60 hover:text-foreground flex min-h-10 w-full items-center gap-2 rounded-md px-2 text-left transition-colors"
        @click="historyOpen = true"
      >
        <span class="min-w-0 flex-1 truncate">
          Изменено: {{ userName(s.lastChange.user) }} · {{ formatDateTime(s.lastChange.at) }}
        </span>
        <span class="text-foreground flex shrink-0 items-center gap-1 font-medium">
          <History class="size-3.5" />История<ChevronRight class="size-3.5" />
        </span>
      </button>
      <p v-else class="flex min-h-10 items-center px-2">Без изменений с импорта</p>
    </footer>

    <MoveDialog
      v-model:open="moveOpen"
      :service-title="s.title"
      :current-category-id="s.categoryId"
      @select="move"
    />
    <HistorySheet v-model:open="historyOpen" :service-id="s.id" :service-title="s.title" />
  </article>
</template>
