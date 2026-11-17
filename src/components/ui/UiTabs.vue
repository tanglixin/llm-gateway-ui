<script setup lang="ts">
defineProps<{ tabs: { k: string; label: string }[]; modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
  <div class="tabs">
    <button
      v-for="t in tabs" :key="t.k"
      class="tab" :class="{ on: modelValue === t.k }"
      @click="emit('update:modelValue', t.k)"
    >{{ t.label }}</button>
  </div>
</template>
