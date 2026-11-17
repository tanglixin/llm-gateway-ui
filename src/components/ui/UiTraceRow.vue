<script setup lang="ts">
withDefaults(defineProps<{ name: string; left: number; width: number; ms: string; color?: string }>(), { color: '' })
</script>

<template>
  <div class="trace-row">
    <span class="trace-name">{{ name }}</span>
    <div class="track"><i :class="color" :style="{ left: left + '%', width: width + '%' }" /></div>
    <span class="trace-ms">{{ ms }}</span>
  </div>
</template>
