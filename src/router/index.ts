import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    { path: '/', name: 'home', component: () => import('@/views/CategoriesView.vue') },
    {
      path: '/categories/:id(\\d+)',
      name: 'category',
      component: () => import('@/views/CategoryView.vue'),
      props: (route) => ({ id: Number(route.params.id) }),
    },
    { path: '/journal', name: 'journal', component: () => import('@/views/JournalView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.ensureLoaded()

  if (to.meta.public) {
    return auth.isAuthed && to.name === 'login' ? safeRedirect(to.query.redirect) : true
  }
  if (!auth.isAuthed) {
    return { name: 'login', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } }
  }
  return true
})

export function safeRedirect(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

export default router
