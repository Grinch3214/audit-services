<script setup lang="ts">
import { computed } from 'vue'
import { Download } from '@lucide/vue'
import { EXPORT_URL } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'

const EXPORT_USERS = ['max']

const auth = useAuthStore()
const allowed = computed(() => EXPORT_USERS.includes(auth.user?.login.toLowerCase() ?? ''))
</script>

<template>
  <div v-if="allowed" class="flex flex-col gap-1.5">
    <Button variant="outline" class="h-11 justify-start" as-child>
      <a :href="EXPORT_URL" download><Download />Скачать каталог (JSON)</a>
    </Button>
    <p class="text-muted-foreground px-1 text-xs">Все категории, услуги и цены — для сайта</p>
  </div>
</template>
