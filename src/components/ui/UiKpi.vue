<script setup lang="ts">
defineProps<{ label: string; value: string; unit?: string; foot?: string; color?: string }>()
</script>

<template>
  <div class="kpi" :class="color">
    <div class="kpi-l">{{ label }}</div>
    <div class="kpi-v">{{ value }}<span v-if="unit" class="unit">{{ unit }}</span></div>
    <div v-if="foot" class="kpi-f" v-html="foot" />
  </div>
</template>
