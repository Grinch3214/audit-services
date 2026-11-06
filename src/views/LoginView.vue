<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loader2 } from '@lucide/vue'
import { isApiError } from '@/api'
import { safeRedirect } from '@/router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const login = ref('')
const password = ref('')
const pending = ref(false)
const error = ref('')

const canSubmit = computed(
  () => login.value.trim() !== '' && password.value !== '' && !pending.value,
)

async function submit() {
  if (!canSubmit.value) return
  pending.value = true
  error.value = ''
  try {
    await auth.login({ login: login.value.trim(), password: password.value })
    await router.replace(safeRedirect(route.query.redirect))
  } catch (e) {
    error.value = isApiError(e) ? e.message : 'Не удалось войти'
    password.value = ''
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="flex min-h-[calc(100dvh-2rem)] flex-col items-center justify-center gap-6">
    <img src="/favicon.svg" alt="" class="size-14 rounded-2xl shadow-sm" />

    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle class="text-xl">Вход</CardTitle>
        <CardDescription>Цены и услуги автосервиса</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
          <div class="flex flex-col gap-2">
            <Label for="login">Логин</Label>
            <Input
              id="login"
              v-model="login"
              class="h-11 text-base"
              autocomplete="username"
              autocapitalize="none"
              autocorrect="off"
              spellcheck="false"
              autofocus
              :aria-invalid="!!error"
            />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="password">Пароль</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              class="h-11 text-base"
              autocomplete="current-password"
              :aria-invalid="!!error"
            />
          </div>

          <p v-if="error" role="alert" class="text-destructive text-sm">{{ error }}</p>

          <Button type="submit" size="lg" class="h-11 text-base" :disabled="!canSubmit">
            <Loader2 v-if="pending" class="animate-spin" />
            Войти
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
