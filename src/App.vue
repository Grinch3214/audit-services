<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <main class="mx-auto w-full max-w-2xl px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
    <RouterView />
  </main>
  <Toaster position="top-center" rich-colors />
</template>
