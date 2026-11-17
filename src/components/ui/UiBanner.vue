<script setup lang="ts">
withDefaults(defineProps<{ type?: string; icon?: string }>(), { type: 'info', icon: 'ⓘ' })
</script>

<template>
  <div class="banner" :class="type">
    <span class="bico">{{ icon }}</span>
    <div><slot /></div>
  </div>
</template>
