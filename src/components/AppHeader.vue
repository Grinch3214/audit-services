<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { LogOut, ScrollText } from '@lucide/vue'
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
    <div class="mx-auto flex h-14 w-full max-w-2xl items-center gap-3 px-4 lg:max-w-6xl lg:px-8">
      <RouterLink to="/" class="flex items-center gap-2 font-semibold">
        <img src="/favicon.svg" alt="" class="size-7 rounded-lg" />
        Цены
      </RouterLink>
      <nav class="ml-2 flex items-center gap-1">
        <RouterLink
          to="/journal"
          class="text-muted-foreground hover:text-foreground hover:bg-muted flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors"
          active-class="text-foreground bg-muted"
        >
          <ScrollText class="size-4" />Журнал
        </RouterLink>
      </nav>
      <span class="text-muted-foreground ml-auto truncate text-sm">{{ auth.user?.name }}</span>
      <Button variant="ghost" size="icon" aria-label="Выйти" :disabled="leaving" @click="logout">
        <LogOut />
      </Button>
    </div>
  </header>
</template>
