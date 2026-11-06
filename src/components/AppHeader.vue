<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { LogOut } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'

const auth = useAuthStore()
const router = useRouter()
const leaving = ref(false)

async function logout() {
  leaving.value = true
  try {
    await auth.logout()
  } catch {
    toast.error('Не удалось выйти на сервере, сессия сброшена локально')
  } finally {
    leaving.value = false
    await router.replace({ name: 'login' })
  }
}
</script>

<template>
  <header
    class="bg-background/80 sticky top-0 z-40 border-b pt-[env(safe-area-inset-top)] backdrop-blur"
  >
    <div class="mx-auto flex h-14 w-full max-w-2xl items-center gap-3 px-4">
      <RouterLink to="/" class="flex items-center gap-2 font-semibold">
        <img src="/favicon.svg" alt="" class="size-7 rounded-lg" />
        Цены
      </RouterLink>
      <span class="text-muted-foreground ml-auto truncate text-sm">{{ auth.user?.name }}</span>
      <Button variant="ghost" size="icon" aria-label="Выйти" :disabled="leaving" @click="logout">
        <LogOut />
      </Button>
    </div>
  </header>
</template>
