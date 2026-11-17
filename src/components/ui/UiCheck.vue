<script setup lang="ts">
defineProps<{ label: string; fr?: string; checked: boolean }>()
const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <label class="chk" :class="{ on: checked }" @click.prevent="emit('toggle')">
    <span class="chk-box">{{ checked ? '✓' : '' }}</span>
    <span class="chk-t" v-html="label" />
    <span v-if="fr" class="fr gray">{{ fr }}</span>
  </label>
</template>
