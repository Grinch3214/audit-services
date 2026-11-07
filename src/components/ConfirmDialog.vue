<script setup lang="ts">
import { confirmState, settleConfirm } from '@/composables/useConfirm'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function onOpenChange(v: boolean) {
  if (!v) settleConfirm(false)
}
</script>

<template>
  <Dialog :open="confirmState.open" @update:open="onOpenChange">
    <DialogContent :show-close-button="false" class="gap-5 sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>{{ confirmState.options.title }}</DialogTitle>
        <DialogDescription v-if="confirmState.options.description" class="break-words">
          {{ confirmState.options.description }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter class="gap-2 sm:gap-2">
        <Button variant="outline" class="h-11 sm:h-9" @click="settleConfirm(false)">
          Отмена
        </Button>
        <Button
          :variant="confirmState.options.destructive === false ? 'default' : 'destructive'"
          class="h-11 sm:h-9"
          @click="settleConfirm(true)"
        >
          {{ confirmState.options.confirmLabel ?? 'Удалить' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
