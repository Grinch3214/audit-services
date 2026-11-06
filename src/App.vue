<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { Toaster } from '@/components/ui/sonner'
import AppHeader from '@/components/AppHeader.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const showHeader = computed(() => auth.isAuthed && !route.meta.public)
</script>

<template>
  <AppHeader v-if="showHeader" />
  <main class="mx-auto w-full max-w-2xl px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
    <RouterView />
  </main>
  <Toaster position="top-center" rich-colors />
</template>
