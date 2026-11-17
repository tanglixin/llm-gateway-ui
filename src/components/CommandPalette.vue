<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ALL_VIEWS, NAV, PAGE_META } from '@/data/mock'
import { useConsole } from '@/stores/console'

const store = useConsole()
const router = useRouter()

const query = ref('')
const input = ref<HTMLInputElement | null>(null)

const items = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = ALL_VIEWS.map(k => {
    const nav = NAV.flatMap(g => g.items).find(i => i.k === k)!
    return { k, name: nav.n, fr: PAGE_META[k].fr.join(' ') }
  })
  if (!q) return list
  return list.filter(i => i.name.toLowerCase().includes(q) || i.fr.toLowerCase().includes(q) || i.k.includes(q))
})

watch(() => store.cmdkOpen, async open => {
  if (open) {
    query.value = ''
    await nextTick()
    input.value?.focus()
  }
})

function close(): void {
  store.cmdkOpen = false
}

function pick(k: string): void {
  close()
  void router.push({ path: `/${k}` })
}
</script>

<template>
  <div v-if="store.cmdkOpen" class="cmdk on">
    <input ref="input" v-model="query" class="cmdk-inp" placeholder="输入页面名、FR 编号或命令…" @keydown.esc="close" />
    <div class="cmdk-list">
      <div v-for="i in items" :key="i.k" class="cmdk-item" @click="pick(i.k)">
        <span>{{ i.name }}</span>
        <span class="path">{{ i.fr }}</span>
      </div>
      <div v-if="items.length === 0" class="cmdk-item muted">没有匹配项</div>
    </div>
  </div>
  <div v-if="store.cmdkOpen" class="mask on" @click="close" />
</template>
