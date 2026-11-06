import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Временная заглушка — заменится экранами в модулях 2–3
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
