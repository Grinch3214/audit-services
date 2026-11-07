import { reactive } from 'vue'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  destructive?: boolean
}

export const confirmState = reactive({
  open: false,
  options: { title: '' } as ConfirmOptions,
  resolve: null as ((ok: boolean) => void) | null,
})

export function settleConfirm(ok: boolean) {
  confirmState.resolve?.(ok)
  confirmState.resolve = null
  confirmState.open = false
}

export function confirm(options: ConfirmOptions): Promise<boolean> {
  settleConfirm(false)
  confirmState.options = options
  confirmState.open = true
  return new Promise((resolve) => (confirmState.resolve = resolve))
}
