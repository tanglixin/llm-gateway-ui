<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { NAV, PAGE_META, ROLE_NAME } from '@/data/mock'
import { useConsole } from '@/stores/console'
import { useAuth } from '@/stores/auth'

const props = defineProps<{ active: string }>()
const store = useConsole()
const router = useRouter()
const auth = useAuth()

function logout(): void {
  auth.logout()
  void router.push('/overview')
}

const crumb = computed(() => {
  const g = NAV.find(x => x.items.some(i => i.k === props.active))
  const name = g ? g.g.split(' ')[0] : '工作台'
  return `${name} / ${PAGE_META[props.active]?.title ?? ''}`
})
</script>

<template>
  <header class="topbar">
    <div class="crumb">{{ crumb }}</div>
    <div class="top-sep" />
    <div class="health">
      <span class="dot" :class="{ warn: store.drill }" />
      <span>{{ store.drill ? '主模型熔断 · 已降级' : '全部服务正常' }}</span>
    </div>

    <button class="search" @click="store.cmdkOpen = true">
      <span>⌕</span><span>搜索页面、需求编号、命令…</span><kbd>⌘K</kbd>
    </button>

    <button class="icon-btn" title="通知" @click="store.toast('3 条未读通知（演示）')">
      ♧<span class="cnt">3</span>
    </button>

    <select v-model="store.role" class="role-sel" title="切换角色预览权限裁剪">
      <option v-for="(name, key) in ROLE_NAME" :key="key" :value="key">{{ name }}</option>
    </select>

    <div class="whoami" :title="auth.user?.email">
      <div class="who-name">{{ auth.user?.name || '未登录' }}</div>
      <div class="who-tenant mono">{{ auth.user?.tenant }} · {{ auth.user?.role }}</div>
    </div>

    <button class="btn sm" title="退出登录" @click="logout">退出</button>

    <div class="avatar">{{ (auth.user?.name || 'U').slice(0, 1) }}</div>
  </header>
</template>
