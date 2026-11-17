<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHead from '@/components/PageHead.vue'
import UiBanner from '@/components/ui/UiBanner.vue'
import UiBar from '@/components/ui/UiBar.vue'
import UiCard from '@/components/ui/Card.vue'
import UiKpi from '@/components/ui/UiKpi.vue'
import UiSparkline from '@/components/ui/UiSparkline.vue'
import UiTag from '@/components/ui/UiTag.vue'
import UiTimeline from '@/components/ui/UiTimeline.vue'
import { OVERVIEW_ALERTS, OVERVIEW_ROADMAP, OVERVIEW_SERVICES, PAGE_META, ROLE_VIEWS, WEEK } from '@/data/mock'
import { useConsole } from '@/stores/console'
import { usageSummary, type UsageSummary } from '@/api/client'

const store = useConsole()
const meta = PAGE_META.overview
const week = computed(() => (store.role === 'ops' ? undefined : WEEK.overview))

const usage = ref<UsageSummary | null>(null)
const kb = ref<{ documents: number; chunks: number }>({ documents: 0, chunks: 0 })

onMounted(async () => {
  try {
    const res = await usageSummary('all')
    usage.value = res.summary
    kb.value = { documents: res.documents, chunks: res.chunks }
  } catch {
    /* 失败保留"—"，不阻塞页面 */
  }
})

const kpis = computed(() => {
  const u = usage.value
  if (!u) {
    return [
      { label: '调用次数', value: '—', unit: '次', foot: '加载中…', color: '' },
      { label: 'P95 延迟', value: '—', unit: 'ms', foot: '', color: 'cyan' },
      { label: '累计成本', value: '—', unit: '¥', foot: '', color: 'warn' },
      { label: '知识库', value: '—', unit: '块', foot: '', color: 'ok' },
    ]
  }
  return [
    { label: '调用次数', value: u.requests.toLocaleString(), unit: '次', foot: `${u.tokensTotal.toLocaleString()} tokens · ${u.models.length} 个模型`, color: '' },
    { label: 'P95 延迟', value: String(u.p95LatencyMs), unit: 'ms', foot: `平均 ${u.avgLatencyMs} ms · 来自真实调用`, color: 'cyan' },
    { label: '累计成本', value: u.cost.toFixed(4), unit: '¥', foot: 'prompt ¥0.14/M + completion ¥0.28/M', color: 'warn' },
    { label: '知识库', value: String(kb.value.chunks), unit: '块', foot: `${kb.value.documents} 份文档 · pgvector`, color: 'ok' },
  ]
})

const services = OVERVIEW_SERVICES as any[]

const alerts = OVERVIEW_ALERTS as any[]

const evidence = [
  { t: 'F1 上传 → 问答 → 引用 → Trace', b: 'P03 文档入库 → P02 流式问答 → 点引用看原文 → 检查器 → P08 Trace 瀑布', c: 'ok', tag: '<span class="tag ok">AC-18</span>' },
  { t: 'F2 调参 → 坏例 → 评测闸门', b: 'P04 发现坏例加入 Golden Set → P09 回归阻断 → 回滚 Prompt 版本', c: '', tag: '<span class="tag info">AC-09</span>' },
  { t: 'F3 故障演练 → 降级 → Runbook', b: 'P06 熔断主模型 → 自动切备用 → P08 告警与审计 → P11 演练记录', c: 'purple', tag: '<span class="tag purple">AC-02</span>' },
]

const roadmap = OVERVIEW_ROADMAP as any[]
</script>

<template>
  <PageHead :title="meta.title" :sub="meta.sub" :fr="meta.fr" :week="week" />

  <template v-if="store.role !== 'ops'">
    <UiBanner type="info" icon="⛨">
      <b>权限裁剪预览</b>：当前角色「{{ store.roleName }}」，仅可见
      {{ ROLE_VIEWS[store.role]?.length }} 个页面。总览中的全局 Provider 指标、账单与部署数据已按角色隐藏，
      切回「运维 / 开发者」可查看全量。
    </UiBanner>
    <UiCard title="可见页面" desc="按 SRS 2.3 RBAC 裁剪">
      <div class="row">
        <UiTag v-for="k in ROLE_VIEWS[store.role] ?? []" :key="k" color="info">{{ k }}</UiTag>
      </div>
    </UiCard>
    <UiCard title="为什么这样设计" desc="全局指标不能靠前端藏">
      <div class="callout">后端必须做 ACL 前置过滤（FR-17）；界面裁剪只是第二道防线。面试时要讲「服务端强制 + 前端收敛」两层的区别。</div>
    </UiCard>
  </template>

  <template v-else>
    <UiBanner type="ok" icon="✓">
      <b>演示环境就绪</b> · 8/8 服务健康，索引 <span class="mono">idx_20261109_01</span> 为当前蓝版，最近一次评测通过。
      今天是 W3 第 4 天，主线目标：把「可观测 + 评测 + 安全」做进界面。
    </UiBanner>

    <div class="grid g4">
      <UiKpi v-for="k in kpis" :key="k.label" :label="k.label" :value="k.value" :unit="k.unit" :foot="k.foot" :color="k.color" />
    </div>

    <div class="grid g23 mt16">
      <UiCard title="请求量与成本趋势" desc="近 14 天 · 双指标归一化展示">
        <template #right>
          <button class="btn sm" @click="store.toast('日报已加入导出队列（演示）', 'ok')">导出日报</button>
        </template>
        <div class="row" style="justify-content: space-between">
          <span class="small muted">请求量（次/日）</span><span class="tag info">峰值 12,840</span>
        </div>
        <UiSparkline
          :values="[8200, 9100, 8700, 10400, 9800, 11200, 10600, 11800, 10900, 12100, 11500, 12400, 11900, 12840]"
          color="#3452D8" :width="620" :height="120"
        />
        <div class="legend">
          <span><i style="background: #3452D8" />请求量</span>
          <span><i style="background: #E79009" />成本（¥）</span>
          <span><i style="background: #0E9F6E" />缓存命中率</span>
        </div>
        <div class="divider" />
        <div class="row" style="justify-content: space-between">
          <span class="small muted">成本（¥ / 日）</span><span class="tag warn">已达预算 72%</span>
        </div>
        <UiSparkline
          :values="[52, 58, 55, 68, 63, 74, 70, 79, 73, 86, 81, 92, 88, 86]"
          color="#E79009" :width="620" :height="90"
        />
      </UiCard>

      <UiCard title="服务健康矩阵" desc="8 个 Compose 服务 · /healthz 轮询">
        <template #right>
          <button class="btn sm" @click="$router.push('/ops')">查看运维面板 →</button>
        </template>
        <div v-for="s in services" :key="s[0]" class="spread" style="padding: 6px 0; border-bottom: 1px solid var(--line-2)">
          <span class="small strong mono">{{ s[0] }}</span><UiTag :color="s[2]">{{ s[1] }}</UiTag>
        </div>
        <div class="mt12 small muted">无状态网关可水平扩容；滚动更新不中断既有 SSE 流（NFR-02）。</div>
      </UiCard>
    </div>

    <div class="grid g2 mt16">
      <UiCard title="最近告警与处置" desc="四类告警均已配置并演练（NFR-05）">
        <template #right>
          <button class="btn sm" @click="$router.push('/observability')">全部告警 →</button>
        </template>
        <UiTimeline :items="alerts" />
      </UiCard>

      <UiCard title="证据链 · 三条端到端流程" desc="演示与面试时最有力的一条路径">
        <UiTimeline :items="evidence" />
        <div class="callout mt12">
          一次问答要能下钻到：引用片段 → 检索分数 → Trace Span → Token 成本 → 审计记录。
          这条链是本系统区别于培训班 Demo 的核心。
        </div>
      </UiCard>
    </div>

    <UiCard title="4 周实施进度" desc="与 SRS 第 9 章 / 4-week-roadmap.md 对齐" pad0>
      <div style="padding: 4px 18px 18px">
        <div v-for="w in roadmap" :key="w[0]" style="padding: 9px 0; border-bottom: 1px solid var(--line-2)">
          <div class="spread">
            <span class="small"><b class="mono">{{ w[0] }}</b> · {{ w[1] }} <span class="muted mono tiny">{{ w[2] }}</span></span>
            <span class="tag" :class="w[4]">{{ w[3] }}%</span>
          </div>
          <div class="mt8"><UiBar :pct="w[3]" :color="w[3] === 100 ? 'ok' : w[3] > 0 ? 'warn' : ''" /></div>
        </div>
      </div>
    </UiCard>
  </template>
</template>
