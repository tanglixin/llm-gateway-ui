<script setup lang="ts">
import { useConsole } from '@/stores/console'

const store = useConsole()
</script>

<template>
  <div class="mask" :class="{ on: store.drawer.open }" @click="store.closeDrawer()" />
  <aside class="drawer" :class="{ on: store.drawer.open }">
    <div class="drawer-h">
      <b style="font-size: 14px">{{ store.drawer.title }}</b>
      <button class="btn sm ghost" style="margin-left: auto" @click="store.closeDrawer()">✕ 关闭</button>
    </div>
    <div class="drawer-b" v-html="store.drawer.body" />
  </aside>
</template>
