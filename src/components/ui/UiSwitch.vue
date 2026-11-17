<script setup lang="ts">
defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()
</script>

<template>
  <button class="switch" :class="{ on: modelValue }" @click="emit('update:modelValue', !modelValue)" />
</template>
