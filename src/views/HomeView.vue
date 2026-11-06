<script setup lang="ts">
// Временная витрина на shadcn-компонентах и фейковых данных. Удалится в модуле 3.
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { Check, History, Pencil, Plus, Search, Trash2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

import type { ServiceStatus } from '@/api'
import { STATUS, STATUS_CHOICES, nextStatus } from '@/lib/status'

const statuses = STATUS_CHOICES.map((c) => STATUS[c])
const status = ref<ServiceStatus>('yes')
const filter = ref<'all' | 'unknown'>('all')
const toggle = (code: ServiceStatus) => (status.value = nextStatus(status.value, code))
</script>

<template>
  <div class="flex flex-col gap-4">
    <header class="flex flex-col gap-4">
      <h1 class="text-2xl font-semibold tracking-tight">Каталог</h1>
      <div class="flex flex-col gap-2">
        <div class="flex justify-between text-sm">
          <span class="text-muted-foreground">Проверено</span>
          <span class="tabular-nums"
            ><b>37</b> <span class="text-muted-foreground">/ 190</span></span
          >
        </div>
        <Progress :model-value="19" />
      </div>
      <div class="relative">
        <Search class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input class="h-11 pl-9 text-base" placeholder="Поиск услуги или позиции" />
      </div>
    </header>

    <div class="flex gap-2">
      <Button
        size="sm"
        class="rounded-full"
        :variant="filter === 'all' ? 'default' : 'outline'"
        @click="filter = 'all'"
        >Все</Button
      >
      <Button
        size="sm"
        class="rounded-full"
        :variant="filter === 'unknown' ? 'default' : 'outline'"
        @click="filter = 'unknown'"
        >Непроверенные</Button
      >
    </div>

    <Card>
      <CardHeader class="flex flex-row items-center justify-between">
        <CardTitle class="text-lg">Развал-схождение</CardTitle>
        <Button variant="ghost" size="icon" aria-label="Переименовать"><Pencil /></Button>
      </CardHeader>

      <CardContent class="flex flex-col gap-4">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="s in statuses"
            :key="s.code"
            :aria-pressed="status === s.code"
            :class="[
              'h-10 rounded-full border px-4 text-sm font-medium transition-colors active:scale-95',
              status === s.code ? s.chip : 'bg-background text-muted-foreground hover:bg-muted',
            ]"
            @click="toggle(s.code)"
          >
            {{ s.label }}
          </button>
        </div>

        <p class="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm">
          Только легковые, без пневмоподвески
        </p>

        <ul class="divide-y">
          <li class="flex min-h-12 items-center gap-3">
            <span class="flex-1">Развал-схождение 1 ось</span>
            <span class="font-semibold tabular-nums">от 40 ₾</span>
            <Badge variant="secondary"><Check />верно</Badge>
          </li>
          <li class="flex min-h-12 items-center gap-3">
            <span class="text-muted-foreground flex-1">
              Развал-схождение 2 оси <span class="text-xs">· за ось</span>
            </span>
            <span class="text-muted-foreground font-semibold tabular-nums">от 60 ₾</span>
            <Button size="sm" variant="outline" @click="toast.success('Цена подтверждена')">
              <Check />верно
            </Button>
          </li>
          <li class="flex min-h-12 items-center gap-3">
            <span class="flex-1">Прогрев болтов</span>
            <span class="text-muted-foreground text-sm">по договорённости</span>
          </li>
        </ul>
        <Button variant="ghost" size="sm" class="self-start"><Plus />позиция</Button>
      </CardContent>

      <Separator />
      <CardFooter class="text-muted-foreground flex justify-between text-xs">
        <span>Изменено: Дима · 05.11, 14:20</span>
        <div class="flex gap-1">
          <Button variant="ghost" size="sm"><History />История</Button>
          <Button
            variant="destructive"
            size="icon-sm"
            aria-label="Удалить"
            @click="toast.error('Уже изменил dima — обновите данные')"
            ><Trash2
          /></Button>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>
