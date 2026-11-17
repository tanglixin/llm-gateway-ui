<script setup lang="ts">
import PageHead from '@/components/PageHead.vue'
import UiBar from '@/components/ui/UiBar.vue'
import UiCard from '@/components/ui/Card.vue'
import UiCode from '@/components/ui/UiCode.vue'
import UiSparkline from '@/components/ui/UiSparkline.vue'
import UiTable from '@/components/ui/UiTable.vue'
import UiTabs from '@/components/ui/UiTabs.vue'
import UiTag from '@/components/ui/UiTag.vue'
import UiTimeline from '@/components/ui/UiTimeline.vue'
import UiTraceRow from '@/components/ui/UiTraceRow.vue'
import { computed, onMounted, ref } from 'vue'
import { AUDIT, OBS_RULES, PAGE_META, WEEK } from '@/data/mock'
import { observability, listTraces, getTrace, type ObsBucket, type SpanInfo, type TraceSummary } from '@/api/client'
import { useConsole } from '@/stores/console'

const store = useConsole()
const meta = PAGE_META.observability
const tabs = [
  { k: 'metrics', label: '指标大盘' }, { k: 'traces', label: 'Trace 回放' },
  { k: 'alerts', label: '告警规则' }, { k: 'audit', label: '审计流水' },
]

const series = ref<ObsBucket[]>([])
const recent = ref<Awaited<ReturnType<typeof observability>>['recent']>([])
const loadFailed = ref(false)

onMounted(async () => {
  try {
    const res = await observability(180)
    series.value = res.series
    recent.value = res.recent
  } catch {
    loadFailed.value = true
  }
})

// 四个图都由真实时间序列生成；没有数据时给一条零线，避免图区塌陷
const charts = computed(() => {
  const pick = (fn: (b: ObsBucket) => number) => {
    const v = series.value.map(fn)
    return v.length >= 2 ? v : [0, 0]
  }
  const totalReq = series.value.reduce((n, b) => n + b.requests, 0)
  const totalTok = series.value.reduce((n, b) => n + b.tokens, 0)
  const last = series.value[series.value.length - 1]

  return [
    { t: '每分钟请求数', d: `共 ${totalReq} 次 · ${series.value.length} 个时间桶`, v: pick(b => b.requests), c: '#3452D8', s: '' },
    { t: '平均延迟', d: last ? `最近 ${last.avgMs} ms` : '暂无数据', v: pick(b => b.avgMs), c: '#0891B2', s: last && last.avgMs > 3000 ? 'warn' : 'ok' },
    { t: 'P95 延迟', d: last ? `最近 ${last.p95Ms} ms` : '暂无数据', v: pick(b => b.p95Ms), c: '#E79009', s: last && last.p95Ms > 8000 ? 'warn' : 'ok' },
    { t: '每分钟 Token', d: `共 ${totalTok.toLocaleString()} tokens`, v: pick(b => b.tokens), c: '#7C4DD8', s: '' },
  ]
})

const rules = OBS_RULES as any[]

const traceList = ref<TraceSummary[]>([])
const spans = ref<SpanInfo[]>([])
const currentTrace = ref('')
const traceFailed = ref(false)

const KIND_COLOR: Record<string, string> = { server: 'cyan', internal: '', client: 'purple' }

// 把 span 映射成瀑布图的行：左侧偏移、宽度、按父子关系缩进
const traces = computed(() => {
  if (spans.value.length === 0) return []
  const total = Math.max(...spans.value.map(s => s.startMs + s.durationMs), 1)

  const depth = new Map<string, number>()
  for (const s of spans.value) {
    depth.set(s.spanId, s.parentSpanId ? (depth.get(s.parentSpanId) ?? 0) + 1 : 0)
  }

  return spans.value.map(s => {
    const d = depth.get(s.spanId) ?? 0
    return [
      '    '.repeat(d) + s.name,
      Number(((s.startMs / total) * 100).toFixed(1)),
      Math.max(Number(((s.durationMs / total) * 100).toFixed(1)), 0.8),
      `${s.durationMs} ms`,
      s.status === 'error' ? 'danger' : (KIND_COLOR[s.kind] ?? ''),
    ]
  }) as Array<[string, number, number, string, string]>
})

async function loadTraces(): Promise<void> {
  try {
    const { traces: list } = await listTraces(20)
    traceList.value = list
    // 挑 span 最多的那条：单 span 的请求没有瀑布可看
    const target = [...list].sort((a, b) => b.spans - a.spans)[0] ?? list[0]
    if (target) {
      currentTrace.value = target.traceId
      const res = await getTrace(target.traceId)
      spans.value = res.spans
    }
  } catch {
    traceFailed.value = true
  }
}

onMounted(() => {
  void loadTraces()
})

// 审计流水：优先用真实调用记录，拿不到再退回样例
const auditRows = computed(() => {
  if (recent.value.length > 0) {
    return recent.value.map(t => [
      `<span class="mono">${t.at.slice(11, 19)}</span>`,
      'default',
      (t.preview || '—').slice(0, 18),
      `<span class="mono">${t.traceId.slice(0, 8)}</span>`,
      'prompt_v3',
      t.model,
      String(t.tokens),
      t.latencyMs > 8000 ? '<span class="tag warn">慢</span>' : '<span class="tag ok">正常</span>',
      '<span class="tag gray">只追加</span>',
    ])
  }
  return AUDIT.map(r => [
    `<span class="mono">${r[0]}</span>`, r[1], r[2], `<span class="mono">${r[3]}</span>`, r[4], r[5], r[6],
    r[7] === '成功' ? '<span class="tag ok">成功</span>' : r[7] === '降级' ? '<span class="tag warn">降级</span>' : '<span class="tag danger">' + r[7] + '</span>',
    '<span class="tag gray">只追加</span>',
  ])
})

// 告警规则 YAML（对应上面四条规则的 Prometheus 表达）
const yaml = `<span class="c-com"># deploy/prometheus/rules.yml</span>
groups:
  - name: <span class="c-str">llm-gateway</span>
    rules:
      - alert: <span class="c-str">CostBudgetExceeded</span>
        expr: llm_day_cost_cny / llm_day_budget_cny &gt; 1.2
        for: 10m
        labels: { severity: warning }
        annotations:
          summary: <span class="c-str">"日成本超过预算 120%"</span>

      - alert: <span class="c-str">ProviderFailing</span>
        expr: rate(llm_provider_errors_total[5m]) &gt; 5
        for: 2m
        labels: { severity: critical }
        annotations:
          summary: <span class="c-str">"主 Provider 连续失败，已熔断切备用"</span>

      - alert: <span class="c-str">FaithfulnessDrop</span>
        expr: llm_eval_faithfulness - llm_eval_faithfulness_baseline &lt; -0.03
        for: 0m
        labels: { severity: warning }
        annotations:
          summary: <span class="c-str">"质量退化，CI 闸门将阻断合并"</span>

      - alert: <span class="c-str">SSEDisconnectHigh</span>
        expr: rate(llm_sse_disconnects_total[5m]) / rate(llm_sse_started_total[5m]) &gt; 0.02
        for: 5m
        labels: { severity: warning }
        annotations:
          summary: <span class="c-str">"SSE 断连率超过 2%，检查代理缓冲与心跳"</span>`
</script>

<template>
  <PageHead :title="meta.title" :sub="meta.sub" :fr="meta.fr" :week="WEEK.observability" />

  <UiTabs v-model="store.tabs.observability" :tabs="tabs" />

  <div class="mt16">
    <template v-if="store.tabs.observability === 'metrics'">
      <div class="grid g2">
        <UiCard v-for="c in charts" :key="c.t" :title="c.t" :desc="c.d">
          <template #right><UiTag :color="c.s || 'gray'">SLO {{ c.s === 'ok' ? '达标' : '观察' }}</UiTag></template>
          <UiSparkline :values="c.v" :color="c.c" :width="420" :height="96" />
          <div class="legend">
            <span><i :style="{ background: c.c }" />近 14 个采样点</span>
            <span class="muted">Grafana 面板同名指标</span>
          </div>
        </UiCard>
      </div>
      <div class="mt16">
        <UiCard title="四类告警规则" desc="NFR-05 要求均配置并演练">
          <UiTable :heads="['规则', '表达式', '动作', '状态']" :rows="rules" />
        </UiCard>
      </div>
    </template>

    <template v-else-if="store.tabs.observability === 'traces'">
      <UiCard :title="`Trace 瀑布图 · ${currentTrace ? currentTrace.slice(0, 12) : '暂无数据'}`"
      :desc="`共 ${spans.length} 个 span，来自 OpenTelemetry（导出到 PostgreSQL）`">
        <template #right>
          <span class="row" style="gap: 6px">
            <select v-model="currentTrace" class="sel" style="padding: 4px 8px" @change="loadTraces()">
              <option v-for="t in traceList" :key="t.traceId" :value="t.traceId">
                {{ t.rootName }} · {{ t.durationMs }}ms · {{ t.spans }} span
              </option>
            </select>
            <button class="btn sm" @click="loadTraces()">刷新</button>
          </span>
        </template>
        <div style="padding: 6px 18px 18px">
          <UiTraceRow v-for="t in traces" :key="t[0]" :name="t[0]" :left="t[1]" :width="t[2]" :ms="t[3]" :color="t[4]" />
          <div v-if="traces.length === 0" class="small muted" style="padding: 12px 0">
            {{ traceFailed ? '读取 trace 失败' : '还没有 trace，先去发起一次对话或 Agent 运行' }}
          </div>
          <div class="divider" />
          <div class="grid g2">
            <div>
              <div class="field-l">关键 Span 属性（NFR-05 要求齐全）</div>
              <UiCode text="trace_id, tenant_id, user_id&#10;prompt_version, model, index_version&#10;retrieval.top_k, chunk_ids, rerank_score&#10;prompt_tokens, completion_tokens, cost&#10;cache_hit, fallback_reason" />
            </div>
            <div>
              <div class="field-l">从这条 Trace 能回答什么</div>
              <UiTimeline :items="[
                { t: '为什么慢？', b: 'llm.generate 占 46% 时长，检索仅 0.5s', c: 'warn' },
                { t: '为什么答案变了？', b: '对比 prompt_version / index_version / model', c: 'ok' },
                { t: '这次花了多少？', b: 'usage.record + 审计流水交叉核对', c: 'purple' },
              ]" />
            </div>
          </div>
        </div>
      </UiCard>

      <div class="grid g3 mt16">
        <UiCard title="采样与覆盖" desc="NFR-05">
          <div class="spread"><span class="small">请求 Trace 覆盖率</span><span class="strong">100%</span></div>
          <div class="mt8"><UiBar :pct="100" color="ok" /></div>
          <div class="small muted mt12">演示环境不做抽样；生产按头部采样 + 错误全采。</div>
        </UiCard>
        <UiCard title="日志" desc="Loki">
          <UiCode text="level=warn trace_id=tr_8f3c21a9&#10;msg=&quot;provider timeout, fallback&quot;&#10;model=DeepSeek-V3 → qwen2:7b" />
          <div class="small muted mt12">结构化 JSON 日志，字段与 Trace 对齐。</div>
        </UiCard>
        <UiCard title="审计只追加" desc="FR-16">
          <div class="callout ok" style="font-size: 11.5px">
            审计表与业务库分离，<b>不暴露 update / delete 接口</b>，按合规设置 TTL。可按 trace_id 完整还原一次问答。
          </div>
        </UiCard>
      </div>
    </template>

    <template v-else-if="store.tabs.observability === 'alerts'">
      <div class="grid g2">
        <UiCard title="告警时间线" desc="今日 4 条 · 均有处置记录">
          <UiTimeline :items="[
            { t: '19:38 · 成本预算 82%', b: '触发预算预警 → 语义缓存权重调高 → 未冻结租户', c: 'warn', tag: '<span class=\'tag warn\'>warn</span>' },
            { t: '19:21 · 主模型恢复', b: '半开探测成功，权重从 0 回升到 60%', c: 'ok', tag: '<span class=\'tag ok\'>resolved</span>' },
            { t: '18:56 · 注入拦截', b: 'beta-ops 租户命中 INJ-03，请求被拒绝并落审计', c: 'danger', tag: '<span class=\'tag danger\'>blocked</span>' },
            { t: '17:40 · 评测闸门通过', b: 'prompt_v3 Faithfulness 91.4% ≥ 基线 89%', c: 'ok', tag: '<span class=\'tag ok\'>pass</span>' },
          ]" />
        </UiCard>
        <UiCard title="告警规则 YAML" desc="可直接复制到 deploy/prometheus/rules.yml">
          <pre v-html="yaml" />
        </UiCard>
      </div>
    </template>

    <template v-else>
      <UiTable :heads="['时间', '租户', '用户', 'trace_id', 'Prompt', '模型', 'Tokens', '结果', '写入方式']" :rows="auditRows">
        <template #tools>
          <span class="small muted">只追加 · 保留期 180 天 · 日志已脱敏</span>
          <button class="btn sm" style="margin-left: auto" @click="store.toast('审计报告已生成（演示）', 'ok')">导出审计报告</button>
        </template>
      </UiTable>

      <div class="grid g2 mt16">
        <UiCard title="按 trace_id 还原" desc="AC-16">
          <UiCode text="trace_id: tr_8f3c21a9&#10;user: tang.lx @ acme-rd&#10;prompt_v3 / DeepSeek-V3 / idx_20261109_01&#10;retrieved: 6 chunks (ck_01a7 … ck_02f1)&#10;tools: none · cache_hit: false&#10;1,534 tokens → ¥0.042 · result: success" />
          <div class="small muted mt12">审计记录与业务库分离，任何更新/删除接口都不暴露。</div>
        </UiCard>
        <UiCard title="面试怎么讲" desc="线上答案变差怎么定位">
          <div class="callout">
            先按 <span class="mono">trace_id</span> 拉出这条链路的 Span 与属性，对比三要素
            <b>prompt_version / index_version / model</b>；再用评测面板看同期 Faithfulness 是否退化；
            最后落到 ETL（切片变了？）还是路由（模型被降级了？）。不要靠猜。
          </div>
        </UiCard>
      </div>
    </template>
  </div>
</template>
