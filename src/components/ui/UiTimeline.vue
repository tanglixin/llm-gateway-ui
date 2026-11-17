<script setup lang="ts">
export interface TimelineItem {
  t: string
  b?: string
  c?: string
  tag?: string
}
defineProps<{ items: TimelineItem[] }>()
</script>

<template>
  <div class="tl">
    <div v-for="(it, i) in items" :key="i" class="tl-item" :class="it.c">
      <div class="tl-t">{{ it.t }} <span v-if="it.tag" v-html="it.tag" /></div>
      <div v-if="it.b" class="tl-b" v-html="it.b" />
    </div>
  </div>
</template>
