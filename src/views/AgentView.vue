<script setup lang="ts">
import { computed } from 'vue'
import PageHead from '@/components/PageHead.vue'
import UiBar from '@/components/ui/UiBar.vue'
import UiCard from '@/components/ui/Card.vue'
import UiTable from '@/components/ui/UiTable.vue'
import UiTag from '@/components/ui/UiTag.vue'
import UiTimeline from '@/components/ui/UiTimeline.vue'
import { computed as _c } from 'vue'
import { PAGE_META, WEEK } from '@/data/mock'
import { useConsole } from '@/stores/console'

const store = useConsole()
const meta = PAGE_META.agent
const KIND_LABEL: Record<string, string> = {
  thought: 'Thought',
  action: 'Action',
  observation: 'Observation',
  final: 'Final',
}
const KIND_COLOR: Record<string, string> = {
  thought: '',
  action: 'cyan',
  observation: 'ok',
  final: 'purple',
}

// 把真实轨迹映射成时间线组件需要的形状
const steps = computed(() =>
  store.agent.steps.map(s => ({
    t: KIND_LABEL[s.kind] ?? s.kind,
    b:
      s.kind === 'action'
        ? `<span class="mono">${s.tool} ${(s.input ?? '').slice(0, 90)}</span>` +
          (s.durationMs ? ` · ${s.durationMs} ms` : '')
        : (s.content ?? '').replace(/\n/g, '<br/>').slice(0, 400),
    c: KIND_COLOR[s.kind] ?? '',
    tag: s.kind === 'action' && s.durationMs ? `<span class="tag gray">${s.durationMs} ms</span>` : '',
  })),
)

const tools = computed(() => {
  if (store.agent.tools.length === 0) {
    return [['<span class="mono">kb_search</span>', '—', '<span class="tag gray">未运行</span>']]
  }
  return store.agent.tools.map(t => [
    `<span class="mono">${t.name}</span>`,
    `<span class="mono">${t.spec}</span>`,
    '<span class="tag ok">已注册</span>',
  ])
})
</script>

<template>
  <PageHead :title="meta.title" :sub="meta.sub" :fr="meta.fr" :week="WEEK.agent" />

  <div class="grid g32">
    <UiCard title="任务入口" desc="POST /api/agent/run · 返回状态与 checkpoint">
      <div class="field-l">用户任务</div>
      <textarea v-model="store.agent.task" class="inp" rows="3" />
      <div class="row mt12">
        <button class="btn primary" :disabled="store.agent.running" @click="store.runAgent(store.agent.task)">
          {{ store.agent.running ? '运行中…' : '▶ 运行 Agent' }}
        </button>
        <button class="btn sm" @click="store.toast('已从 ckpt_04 恢复（演示）')">从 checkpoint 恢复</button>
        <button class="btn sm danger" @click="store.toast('已传播 cancel，循环保护生效', 'warn')">强制终止</button>
      </div>

      <div class="divider" />
      <div class="field-l">执行护栏</div>
      <div class="spread small" style="padding: 5px 0">
        <span>最大步数</span><span class="mono strong">2（可调）</span>
      </div>
      <UiBar :pct="(store.agent.steps.filter(s => s.kind === 'action').length / 2) * 100" color="cyan" />
      <div class="spread small mt12" style="padding: 5px 0"><span>上下文窗口占用</span><span class="mono strong">38%</span></div>
      <UiBar :pct="38" color="warn" />
      <div class="spread small mt12" style="padding: 5px 0"><span>单任务 Token 上限</span><span class="mono strong">8,000</span></div>
      <UiBar :pct="31" color="ok" />
      <div class="callout warn mt16" style="font-size: 11.5px">
        死循环最早往往不是被步数发现的，而是被<b>账单</b>发现的：单任务成本超阈值 + 步数上限 + 重复 Action 检测，三重护栏缺一不可。
      </div>
    </UiCard>

    <UiCard title="ReAct 执行轨迹" desc="Thought → Action → Observation → Final">
      <div class="spread" style="margin-bottom: 12px">
        <span class="small muted">
          共 {{ steps.length }} 步 · <span class="mono">maxSteps 2</span>
        </span>
        <span class="row" style="gap: 6px">
          <UiTag v-if="store.agent.grounded === true" color="ok">数字均可溯源</UiTag>
          <UiTag v-else-if="store.agent.grounded === false" color="danger">
            {{ store.agent.unverified.length }} 个数字无出处
          </UiTag>
          <UiTag :color="store.agent.running ? 'warn' : 'ok'">{{ store.agent.running ? '执行中' : '已完成' }}</UiTag>
        </span>
      </div>
      <UiTimeline :items="steps" />
      <div v-if="steps.length === 0" class="small muted">点「运行 Agent」开始，真实调用模型与工具（约 30-40 秒）</div>
      <div v-else class="callout ok mt8">
        任务在 6 步内收敛，未触发循环保护；工具调用与 Token 消耗已写入审计流水（FR-16）。
      </div>
    </UiCard>
  </div>

  <div class="grid g3 mt16">
    <UiCard title="工具注册表" desc="Tool / Function Calling">
      <UiTable :heads="['工具', '参数', '状态']" :rows="tools" />
      <div class="small muted mt12">
        工具定义用 JSON Schema 校验参数，模型返回非法参数直接拒绝执行并回 Observation 让模型重试（FR-13）。
      </div>
    </UiCard>

    <UiCard title="MCP Client" desc="FR-11 · Should">
      <div class="spread" style="padding: 8px 0; border-bottom: 1px solid var(--line-2)">
        <span class="small"><b class="mono">filesystem-server</b><br /><span class="tiny muted">stdio · 已准入</span></span>
        <UiTag color="ok">已连接</UiTag>
      </div>
      <div class="spread" style="padding: 8px 0; border-bottom: 1px solid var(--line-2)">
        <span class="small"><b class="mono">internal-wiki</b><br /><span class="tiny muted">SSE · 已准入</span></span>
        <UiTag color="ok">已连接</UiTag>
      </div>
      <div class="spread" style="padding: 8px 0">
        <span class="small"><b class="mono">third-party-sql</b><br /><span class="tiny muted">未通过准入评审</span></span>
        <UiTag color="danger">拒绝</UiTag>
      </div>
      <div class="callout mt12" style="font-size: 11.5px">
        MCP 的价值是工具生态复用，新增的是<b>供应链风险</b>：Server 准入、最小权限、工具输出同样要做注入检测。
      </div>
    </UiCard>

    <UiCard title="记忆与上下文" desc="FR-12">
      <UiTimeline :items="[
        { t: '短期记忆', b: 'Redis 存最近 N 轮，带 TTL', c: 'ok' },
        { t: '长期记忆', b: 'PostgreSQL 存摘要与用户偏好', c: 'ok' },
        { t: '压缩事件', b: '窗口占用 > 70% 触发摘要压缩，本会话已压缩 3 轮', c: 'warn' },
        { t: '越界保护', b: '压缩失败则按时间截断并降级，不允许静默溢出', c: 'purple' },
      ]" />
    </UiCard>
  </div>
</template>
