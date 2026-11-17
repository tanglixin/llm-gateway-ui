<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { NAV, ROLE_NAME } from '@/data/mock'
import { useConsole } from '@/stores/console'

const props = defineProps<{ active: string }>()
const store = useConsole()
const router = useRouter()

const groups = computed(() =>
  NAV.map(g => ({ ...g, items: g.items.filter(i => store.visible(i.k)) }))
     .filter(g => g.items.length > 0),
)

function go(k: string): void {
  void router.push({ path: `/${k}` })
}
</script>

<template>
  <aside class="side">
    <div class="brand">
      <div class="brand-logo">LLM</div>
      <div>
        <div class="brand-name">LLM Gateway</div>
        <div class="brand-sub">CONSOLE · 控制台</div>
      </div>
      <span class="env-pill">{{ store.env }}</span>
    </div>

    <nav class="nav">
      <template v-for="g in groups" :key="g.g">
        <div class="nav-group">{{ g.g }}</div>
        <button
          v-for="item in g.items"
          :key="item.k"
          class="nav-item"
          :class="{ on: props.active === item.k }"
          @click="go(item.k)"
        >
          <span class="nav-ico">{{ item.i }}</span>
          <span>{{ item.n }}</span>
          <span v-if="item.key" class="nav-key">⌘{{ item.key }}</span>
        </button>
      </template>
    </nav>

    <div style="padding: 12px 16px; border-top: 1px solid var(--line-2)">
      <div class="tiny muted">当前角色</div>
      <div class="small strong">{{ store.roleName }}</div>
    </div>
  </aside>
</template>
