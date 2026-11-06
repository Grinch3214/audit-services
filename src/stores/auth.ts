import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi, isApiError, type LoginBody, type User } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isAuthed = computed(() => user.value !== null)

  let loading: Promise<void> | null = null

  function ensureLoaded() {
    loading ??= authApi
      .me()
      .then((u) => {
        user.value = u
      })
      .catch((e) => {
        user.value = null
        // Сеть упала — даём повторить при следующей навигации
        if (!isApiError(e) || e.status !== 401) loading = null
      })
    return loading
  }

  async function login(body: LoginBody) {
    user.value = await authApi.login(body)
    loading = Promise.resolve()
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      reset()
    }
  }

  function reset() {
    user.value = null
    loading = Promise.resolve()
  }

  return { user, isAuthed, ensureLoaded, login, logout, reset }
})
