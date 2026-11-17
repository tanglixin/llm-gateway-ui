<script setup lang="ts">
import PageHead from '@/components/PageHead.vue'
import UiBanner from '@/components/ui/UiBanner.vue'
import UiBar from '@/components/ui/UiBar.vue'
import UiCard from '@/components/ui/Card.vue'
import UiCode from '@/components/ui/UiCode.vue'
import UiDonut from '@/components/ui/UiDonut.vue'
import UiInspectRow from '@/components/ui/UiInspectRow.vue'
import UiTable from '@/components/ui/UiTable.vue'
import UiTag from '@/components/ui/UiTag.vue'
import UiTimeline from '@/components/ui/UiTimeline.vue'
import { computed, onMounted, ref } from 'vue'
import { PAGE_META, WEEK } from '@/data/mock'
import { gatewayStatus, gatewayDrill, type ProviderStatus } from '@/api/client'
import { useAuth } from '@/stores/auth'
import { useConsole } from '@/stores/console'

const store = useConsole()
const meta = PAGE_META.gateway

const auth = useAuth()
const providers = ref<ProviderStatus[]>([])
const drilling = ref(false)

const stateLabel: Record<string, string> = { closed: '健康', half: '半开', open: '熔断' }
const stateColor: Record<string, string> = { closed: 'ok', half: 'warn', open: 'danger' }

const totalWeight = computed(() => providers.value.reduce((n, p) => n + p.weight, 0) || 1)

async function loadProviders(): Promise<void> {
  try {
    const res = await gatewayStatus()
    providers.value = res.providers
  } catch (err) {
    store.toast(`读取 provider 失败：${err instanceof Error ? err.message : err}`, 'danger')
  }
}

async function toggleDrill(): Promise<void> {
  drilling.value = true
  try {
    const next = !store.drill
    const res = await gatewayDrill(next)
    store.drill = next
    providers.value = res.providers
    store.toast(res.message, next ? 'warn' : 'ok')
  } catch (err) {
    store.toast(`演练失败：${err instanceof Error ? err.message : err}`, 'danger')
  } finally {
    drilling.value = false
  }
}

onMounted(() => {
  void loadProviders()
})

const capabilities = [
  ['鉴权 / 租户识别', '<span class="mono">internal/middleware/</span>', 'FR-17'],
  ['限流 / 熔断 / 超时', '<span class="mono">internal/gateway/</span>', 'FR-02'],
  ['Token 计量与计费', '<span class="mono">pkg/tokencalc/</span>', 'FR-04'],
  ['审计日志埋点', '<span class="mono">internal/middleware/</span>', 'FR-16'],
  ['OTel Trace 注入', '<span class="mono">pkg/otel/</span>', 'FR-15'],
  ['SSE 心跳 / 断线续传', '<span class="mono">internal/middleware/</span>', 'FR-03'],
]
</script>

<template>
  <PageHead :title="meta.title" :sub="meta.sub" :fr="meta.fr" :week="WEEK.gateway" />

  <UiBanner v-if="store.drill" type="warn" icon="⚠">
    <b>故障演练进行中</b> · DeepSeek-V3 连续 5 次失败 → 熔断器 <span class="mono">OPEN</span> →
    30s 内把流量切到 qwen2:7b + OpenAI 兼容端点 → 半开探测成功后权重回升。
    已生成 1 条告警与 1 条审计记录，可在 P08 查看。
  </UiBanner>
  <UiBanner v-else type="info" icon="⇄">
    <b>Provider 抽象层</b>：新增模型只实现统一接口，业务代码不改一行。路由策略支持按权重 / 按模型能力 / 优先级降级；
    这是面试「为什么要做 Provider 层」的标准答案。
  </UiBanner>

  <div class="grid g4">
    <div
      v-for="p in providers" :key="p.name"
      style="border-radius: 11px; padding: 14px 16px"
      :style="{
        border: `1px solid ${p.state === 'open' ? '#F3C9CB' : 'var(--line)'}`,
        background: p.state === 'open' ? 'var(--danger-soft)' : '#fff',
      }"
    >
      <div class="spread"><span class="strong small">{{ p.name }}</span><UiTag :color="stateColor[p.state]">{{ stateLabel[p.state] }}</UiTag></div>
      <div class="tiny muted mt8">{{ p.kind }} · {{ p.model }}</div>
      <div class="spread small mt12"><span>路由权重</span><span class="mono strong">{{ Math.round((p.weight / totalWeight) * 100) }}%</span></div>
      <div class="mt8"><UiBar :pct="Math.round((p.weight / totalWeight) * 100)" :color="p.state === 'open' ? 'danger' : 'cyan'" /></div>
      <div class="tiny muted mt8">请求 {{ p.requests }} · 失败 {{ p.errors }}</div>
      <div v-if="p.lastError" class="tiny" style="color: var(--danger); margin-top: 4px">{{ p.lastError.slice(0, 42) }}</div>
      <div class="row mt12">
        <button class="btn sm" @click="loadProviders()">刷新</button>
        <button
          class="btn sm" :disabled="!auth.isAdmin"
          :title="auth.isAdmin ? '' : '需要管理员权限'"
          @click="auth.isAdmin ? toggleDrill() : store.toast('需要管理员权限（当前是 ' + auth.user?.role + '）', 'warn')"
        >{{ store.drill ? '重置演练' : '⚡ 熔断' }}</button>
      </div>
    </div>
  </div>

  <div class="grid g32 mt16">
    <UiCard title="路由与弹性策略" desc="FR-02 · 主模型挂了怎么办">
      <div class="row">
        <UiTag color="info">加权轮询 60/25/10/5</UiTag>
        <UiTag color="gray">能力路由</UiTag>
        <UiTag color="warn">优先级降级</UiTag>
        <UiTag color="ok">30s 自动切换</UiTag>
      </div>
      <div class="divider" />
      <div class="field-l">熔断状态机</div>
      <div class="row">
        <UiTag color="ok">CLOSED</UiTag><span class="muted">→</span>
        <UiTag color="danger">OPEN 5 次失败</UiTag><span class="muted">→</span>
        <UiTag color="warn">HALF-OPEN 探测</UiTag><span class="muted">→</span>
        <UiTag color="ok">CLOSED</UiTag>
      </div>
      <div class="grid g2 mt16">
        <div><div class="field-l">租户 QPS 限额</div><UiCode text="acme-rd: 20 qps&#10;beta-ops: 5 qps" /></div>
        <div><div class="field-l">超时与重试</div><UiCode text="connect: 3s&#10;TTFT: 15s / retry 1" /></div>
      </div>
      <div class="row mt16">
        <button
          class="btn primary" :disabled="drilling || !auth.isAdmin"
          :title="auth.isAdmin ? '' : '需要管理员权限'"
          @click="auth.isAdmin ? toggleDrill() : store.toast('需要管理员权限（当前是 ' + auth.user?.role + '）', 'warn')"
        >{{ store.drill ? '重置演练' : '⚡ 故障演练' }}</button>
        <button class="btn sm" @click="$router.push('/observability')">查看告警 →</button>
        <button class="btn sm" @click="store.toast('路由配置已复制', 'ok')">导出配置</button>
      </div>
    </UiCard>

    <UiCard title="语义缓存" desc="FR-05 · 省钱提速，但有答错风险">
      <UiDonut :pct="27" color="#0891B2" label="命中率" sub="缓存命中率 27%（目标 ≥ 20%）" />
      <div class="divider" />
      <UiInspectRow k="精确缓存键" v="prompt + 模型版本 + 索引版本 + 租户 + ACL" />
      <UiInspectRow k="语义命中阈值" v="0.92（可调）" />
      <UiInspectRow k="TTL" v="30 min" />
      <UiInspectRow k="索引换版" v="联动失效 ✓" />
      <UiInspectRow k="跨租户串数据" v="0 次（回归用例覆盖）" />
      <div class="callout warn mt12" style="font-size: 11.5px">
        语义缓存答错怎么办？阈值 + 误命中抽检 + 低置信度不走缓存 + 用户反馈一键失效。面试别只讲「省了多少钱」。
      </div>
    </UiCard>
  </div>

  <div class="grid g2 mt16">
    <UiCard title="横切能力清单" desc="所有 LLM 请求统一收口，网关无状态可水平扩容">
      <UiTable :heads="['能力', '实现位置', '关联 FR']" :rows="capabilities" />
    </UiCard>

    <UiCard title="AC-02 验收记录" desc="可写进简历的项目故事">
      <div class="callout">
        「我用 5 次连续失败触发熔断，把 60% 权重的主模型流量在 30 秒内切到本地 qwen2:7b，
        用户侧只看到一条琥珀色降级提示，答案没有中断。恢复阶段用半开探测逐步放回权重，避免抖动。」
      </div>
      <UiTimeline :items="[
        { t: '问题', b: '云厂商 API 抖动，P95 从 1.2s 飙到 8s', c: 'danger' },
        { t: '定位', b: 'Grafana 错误率面板 + Trace 中的 llm.generate Span' },
        { t: '方案', b: '熔断 + 优先级降级 + 本地模型兜底', c: 'ok' },
        { t: '证据', b: '故障演练记录、告警时间线、审计流水', c: 'purple' },
      ]" />
    </UiCard>
  </div>
</template>
