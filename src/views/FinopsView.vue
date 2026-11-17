<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHead from '@/components/PageHead.vue'
import UiBanner from '@/components/ui/UiBanner.vue'
import UiBar from '@/components/ui/UiBar.vue'
import UiCard from '@/components/ui/Card.vue'
import UiKpi from '@/components/ui/UiKpi.vue'
import UiSparkline from '@/components/ui/UiSparkline.vue'
import UiStackBar from '@/components/ui/UiStackBar.vue'
import UiSwitch from '@/components/ui/UiSwitch.vue'
import UiTable from '@/components/ui/UiTable.vue'
import UiTag from '@/components/ui/UiTag.vue'
import { FINOPS_QUOTAS, PAGE_META, WEEK } from '@/data/mock'
import { usageSummary, type UsageSummary } from '@/api/client'
import { useConsole } from '@/stores/console'

const store = useConsole()
const meta = PAGE_META.finops

const usage = ref<UsageSummary | null>(null)
const loadError = ref('')

const models = computed(() => {
  const u = usage.value
  if (!u || u.models.length === 0) return []
  const total = u.models.reduce((n, m) => n + Math.max(m.tokensIn + m.tokensOut, 1), 0)
  const palette = ['#3452D8', '#0891B2', '#7C4DD8', '#E79009']
  return u.models.map((m, i) => ({
    n: m.model,
    p: Math.round((Math.max(m.tokensIn + m.tokensOut, 1) / total) * 100),
    c: palette[i % palette.length],
  }))
})

const rows = computed(() => {
  const u = usage.value
  if (!u) return []
  return u.top.map(t => [
    t.at.slice(11, 19),
    t.tenant,
    `<span class="mono">${t.traceId.slice(0, 10)}</span>`,
    (t.preview || '—').slice(0, 18),
    t.model,
    String(t.tokens),
    `<b>¥${t.cost.toFixed(4)}</b>`,
    `<span class="tag gray">${t.latencyMs} ms</span>`,
  ])
})

const kpis = computed(() => {
  const u = usage.value
  if (!u) {
    return [
      { label: '总成本', value: '—', unit: '¥', foot: '加载中…', color: '' },
      { label: '总 Token', value: '—', unit: '', foot: '', color: '' },
      { label: '平均延迟', value: '—', unit: 'ms', foot: '', color: '' },
      { label: 'P95 延迟', value: '—', unit: 'ms', foot: '', color: '' },
    ]
  }
  return [
    { label: '总成本', value: u.cost.toFixed(4), unit: '¥', foot: `按 prompt ¥0.14/M + completion ¥0.28/M 估算`, color: 'warn' },
    { label: '总 Token', value: u.tokensTotal.toLocaleString(), unit: '', foot: `prompt ${u.tokensIn} / completion ${u.tokensOut}`, color: '' },
    { label: '平均延迟', value: String(u.avgLatencyMs), unit: 'ms', foot: `${u.requests} 次调用`, color: 'cyan' },
    { label: 'P95 延迟', value: String(u.p95LatencyMs), unit: 'ms', foot: '来自 messages.latency_ms', color: 'ok' },
  ]
})

onMounted(async () => {
  try {
    const res = await usageSummary('all')
    usage.value = res.summary
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : String(err)
  }
})

const quotas = FINOPS_QUOTAS as any[]
</script>

<template>
  <PageHead :title="meta.title" :sub="meta.sub" :fr="meta.fr" :week="WEEK.finops" />

  <UiBanner type="warn" icon="¥">
    <b>日预算预警</b>：今日已用 ¥86.40 / ¥120.00（72%），按当前增速预计 21:30 触及 80% 预警线。
    缓存已节省 ¥19.20（27% 命中率）。
  </UiBanner>

  <div class="grid g4">
    <UiKpi v-for="k in kpis" :key="k.label" :label="k.label" :value="k.value" :unit="k.unit" :foot="k.foot" :color="k.color" />
  </div>

  <div class="grid g23 mt16">
    <UiCard title="14 天成本趋势" desc="按租户 / 场景 / 模型三维归因（FR-04）">
      <template #right>
        <button class="btn sm" @click="store.toast('账单 CSV 已生成（演示）', 'ok')">导出账单 CSV</button>
      </template>
      <UiSparkline :values="[52, 58, 55, 68, 63, 74, 70, 79, 73, 86, 81, 92, 88, 86]" color="#E79009" :width="640" :height="130" />
      <div class="legend">
        <span><i style="background: #E79009" />总成本</span>
        <span><i style="background: #0E9F6E" />缓存节省</span>
        <span class="muted">虚线 ¥120 为日预算上限</span>
      </div>
      <div class="divider" />
      <div class="field-l">按模型成本构成</div>
      <UiStackBar :parts="models" />
      <div class="legend">
        <span v-for="m in models" :key="m.n"><i :style="{ background: m.c }" />{{ m.n }} {{ m.p }}%</span>
      </div>
    </UiCard>

    <UiCard title="预算与配额" desc="超限降级策略">
      <div class="spread small"><span>今日预算占用</span><span class="mono strong">72%</span></div>
      <div class="mt8"><UiBar :pct="72" color="warn" /></div>
      <div class="spread small mt16"><span>80% 预警</span><UiTag color="warn">已触发</UiTag></div>
      <div class="spread small mt8"><span>100% 动作</span><UiTag color="info">降级到本地模型</UiTag></div>
      <div class="spread small mt8"><span>禁止行为</span><UiTag color="danger">直接截断用户请求</UiTag></div>
      <div class="divider" />
      <div class="spread">
        <span class="small">自动降级开关</span>
        <UiSwitch v-model="store.switches.budget" />
      </div>
      <div class="spread mt8">
        <span class="small">语义缓存</span>
        <UiSwitch v-model="store.switches.cache" />
      </div>
      <div class="callout mt16" style="font-size: 11.5px">
        AC-04：人为构造 Agent 死循环，日预算告警触发并冻结该租户 —— 用「账单」而不是「步数」兜底。
      </div>
    </UiCard>
  </div>

  <div class="mt16">
    <UiTable :heads="['时间', '租户', 'trace_id', '场景', '模型', 'Tokens', '成本', '备注']" :rows="rows">
      <template #tools>
        <span class="small muted">高消耗会话 Top 5</span>
        <button class="btn sm" style="margin-left: auto" @click="store.toast('账单 CSV 已生成（演示）', 'ok')">导出账单 CSV</button>
      </template>
    </UiTable>
  </div>

  <div class="grid g2 mt16">
    <UiCard title="租户配额表" desc="租户管理员可编辑（FR-17）">
      <UiTable
        :heads="['租户', '日预算', 'QPS', '模型白名单', '状态']"
        :rows="quotas"
      />
    </UiCard>

    <UiCard title="面试怎么讲" desc="成本归因是后端优势">
      <div class="callout">
        「我把每一次 LLM 调用都当成一次带计量的 RPC：在网关横切面记录 prompt/completion tokens 和单价，
        按租户、场景、模型三维落库，用 <span class="mono">trace_id</span> 串到 Trace 和审计。
        日预算 80% 预警、100% 降级到本地模型，绝不静默截断。」
      </div>
      <div class="small muted mt12">
        对比只会调包的候选人：他们能回答「怎么调模型」，答不上「这个月为什么多花了 3000 块」。
      </div>
    </UiCard>
  </div>
</template>
