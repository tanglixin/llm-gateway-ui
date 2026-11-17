<script setup lang="ts">
defineProps<{ parts: { n: string; p: number; c: string }[] }>()
</script>

<template>
  <div style="display: flex; height: 12px; border-radius: 6px; overflow: hidden; background: var(--line-2)">
    <i
      v-for="p in parts" :key="p.n"
      :style="{ display: 'block', width: p.p + '%', background: p.c }"
      :title="`${p.n} ${p.p}%`"
    />
  </div>
</template>
