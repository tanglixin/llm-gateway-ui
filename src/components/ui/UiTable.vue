<script setup lang="ts">
defineProps<{ heads: string[]; rows: string[][] }>()
</script>

<template>
  <div class="card pad0">
    <div v-if="$slots.tools" class="tbl-tools"><slot name="tools" /></div>
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr><th v-for="h in heads" :key="h">{{ h }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows" :key="i">
            <td v-for="(cell, j) in row" :key="j" v-html="cell" />
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
