<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ pct: number; color?: string; label?: string; sub?: string }>(), {
  color: '#0E9F6E', label: '', sub: '',
})
const r = 42
const c = computed(() => 2 * Math.PI * r)
const dash = computed(() => ((c.value * props.pct) / 100).toFixed(1))
</script>

<template>
  <div class="donut-wrap">
    <svg width="112" height="112" viewBox="0 0 112 112">
      <circle cx="56" cy="56" :r="r" fill="none" stroke="#EEF1F7" stroke-width="12" />
      <circle
        cx="56" cy="56" :r="r" fill="none" :stroke="color" stroke-width="12"
        stroke-linecap="round" :stroke-dasharray="`${dash} ${c}`" transform="rotate(-90 56 56)"
      />
      <text x="56" y="53" text-anchor="middle" font-size="19" font-weight="750" fill="#111827">{{ pct }}%</text>
      <text x="56" y="70" text-anchor="middle" font-size="9" fill="#94A3B8">{{ label }}</text>
    </svg>
    <div>
      <div style="font-size: 12.5px; font-weight: 700">{{ sub }}</div>
      <div class="small muted mt8">环形图由数据驱动，接真实指标只需替换 <span class="mono">pct</span></div>
    </div>
  </div>
</template>
