<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  values: number[]
  color?: string
  width?: number
  height?: number
}>(), { color: '#3452D8', width: 520, height: 112 })

const geom = computed(() => {
  const vals = props.values
  const w = props.width
  const h = props.height
  const mn = Math.min(...vals) * 0.9
  const mx = Math.max(...vals) * 1.08
  const rg = mx - mn || 1

  const pts = vals.map((v, i) => {
    const x = 8 + (i * (w - 16)) / (vals.length - 1)
    const y = h - 16 - ((v - mn) / rg) * (h - 32)
    return [x.toFixed(1), y.toFixed(1)]
  })
  const line = pts.map(p => p.join(',')).join(' ')
  const area = `8,${h - 10} ${line} ${w - 8},${h - 10}`
  const gridY = [1, 2, 3].map(i => (h - 16 - ((h - 32) * i) / 3).toFixed(1))
  const last = pts[pts.length - 1]
  return { line, area, gridY, last }
})
</script>

<template>
  <svg class="chart" :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none" role="img" aria-label="趋势折线图">
    <line v-for="(y, i) in geom.gridY" :key="i" x1="8" :y1="y" :x2="width - 8" :y2="y" stroke="#EEF1F7" stroke-width="1" />
    <polygon :points="geom.area" :fill="color" opacity=".10" />
    <polyline :points="geom.line" fill="none" :stroke="color" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" />
    <circle :cx="geom.last[0]" :cy="geom.last[1]" r="4" fill="#fff" :stroke="color" stroke-width="2.4" />
  </svg>
</template>
