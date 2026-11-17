<script setup lang="ts">
defineProps<{ k: string; v: string }>()
</script>

<template>
  <div class="inspect-row"><span class="k">{{ k }}</span><span class="v">{{ v }}</span></div>
</template>
