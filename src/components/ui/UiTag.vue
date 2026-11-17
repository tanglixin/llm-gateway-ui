<script setup lang="ts">
withDefaults(defineProps<{ color?: string }>(), { color: 'gray' })
</script>

<template>
  <span class="tag" :class="color"><slot /></span>
</template>
