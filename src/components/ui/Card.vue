<script setup lang="ts">
defineProps<{ title: string; desc?: string; pad0?: boolean }>()
</script>

<template>
  <section class="card" :class="{ pad0 }">
    <div :style="pad0 ? { padding: '16px 18px 0' } : undefined">
      <div class="card-h">
        <div>
          <h3 class="card-t">{{ title }}</h3>
          <div v-if="desc" class="card-d">{{ desc }}</div>
        </div>
        <div v-if="$slots.right" class="right"><slot name="right" /></div>
      </div>
    </div>
    <slot />
  </section>
</template>
