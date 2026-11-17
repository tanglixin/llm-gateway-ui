<script setup lang="ts">
withDefaults(defineProps<{ text?: string; size?: string }>(), { text: '', size: '' })
</script>

<template>
  <div class="code-lite" :style="size ? { fontSize: size } : undefined">
    <slot>{{ text }}</slot>
  </div>
</template>
