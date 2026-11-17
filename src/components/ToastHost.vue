<script setup lang="ts">
import { useConsole } from '@/stores/console'

const store = useConsole()
</script>

<template>
  <div class="toast-wrap">
    <div v-for="t in store.toasts" :key="t.id" class="toast" :class="t.kind">{{ t.text }}</div>
  </div>
</template>
