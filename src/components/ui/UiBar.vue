<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ pct: number; color?: string }>(), { color: '' })
const width = computed(() => `${Math.max(0, Math.min(100, props.pct))}%`)
</script>

<template>
  <div class="bar" :class="color"><i :style="{ width }" /></div>
</template>
