<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useConsole } from '@/stores/console'

defineProps<{ title: string; sub: string; fr: string[]; week?: string }>()
const store = useConsole()
const router = useRouter()

function printPage(): void {
  window.print()
}
</script>

<template>
  <div class="page-head">
    <div>
      <h1 class="page-title">{{ title }}</h1>
      <div class="page-sub">{{ sub }}</div>
      <div class="fr-row">
        <span v-for="f in fr" :key="f" class="fr">{{ f }}</span>
        <span v-if="week" class="fr gray">{{ week }}</span>
      </div>
    </div>
    <div class="head-actions">
      <button class="btn sm" @click="printPage">⎙ 打印 / 存 PDF</button>
      <button class="btn sm" @click="router.push('/design')">◈ 设计规范</button>
      <button class="btn sm primary" @click="store.cmdkOpen = true">⌘K 命令面板</button>
    </div>
  </div>
</template>
