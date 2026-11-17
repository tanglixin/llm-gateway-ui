<script setup lang="ts">
import { computed } from 'vue'
import PageHead from '@/components/PageHead.vue'
import UiBar from '@/components/ui/UiBar.vue'
import UiCard from '@/components/ui/Card.vue'
import UiCheck from '@/components/ui/UiCheck.vue'
import UiCode from '@/components/ui/UiCode.vue'
import UiTable from '@/components/ui/UiTable.vue'
import UiTabs from '@/components/ui/UiTabs.vue'
import UiTag from '@/components/ui/UiTag.vue'
import UiTimeline from '@/components/ui/UiTimeline.vue'
import { CHECKS, OPS_SERVICES, PAGE_META, RUNBOOKS, WEEK } from '@/data/mock'
import { useConsole } from '@/stores/console'

const store = useConsole()
const meta = PAGE_META.ops
const tabs = [
  { k: 'services', label: '服务与 CI' }, { k: 'backup', label: '备份与压测' },
  { k: 'runbook', label: '故障 Runbook' }, { k: 'checklist', label: '上线检查单' },
]

const services = OPS_SERVICES as any[]

const done = computed(() => store.doneChecks)
const pct = computed(() => Math.round((done.value / CHECKS.length) * 100))

const caddy = `<span class="k">reverse_proxy</span> llm-gateway:8080 {
  <span class="k">flush_interval</span> <span class="n">-1</span>
  <span class="k">transport http</span> {
    <span class="k">read_timeout</span> <span class="n">300s</span>
  }
}
<span class="c"># 禁用缓冲 + 长超时 + 心跳：</span>
<span class="c"># 否则用户会看到「一次性吐出全部答案」</span>`
</script>

<template>
  <PageHead :title="meta.title" :sub="meta.sub" :fr="meta.fr" :week="WEEK.ops" />

  <UiTabs v-model="store.tabs.ops" :tabs="tabs" />

  <div class="mt16">
    <template v-if="store.tabs.ops === 'services'">
      <UiTable :heads="['服务', '镜像', '端口', '/healthz', '状态']" :rows="services">
        <template #tools><span class="small muted">Compose 服务矩阵 · 干净云主机 docker compose up -d 后公网可访问（AC-19）</span></template>
      </UiTable>
      <div class="grid g2 mt16">
        <UiCard title="CI/CD 流水线" desc="GitHub Actions">
          <UiTimeline :items="[
            { t: '① go test ./...', b: '单测 + 模块回归', c: 'ok', tag: '<span class=&quot;tag gray&quot;>12s</span>' },
            { t: '② eval gate', b: '128 条 Golden Set，低于基线阻断', c: 'warn', tag: '<span class=&quot;tag gray&quot;>96s</span>' },
            { t: '③ docker build', b: '多阶段、非 root、镜像最小化', c: 'ok', tag: '<span class=&quot;tag gray&quot;>74s</span>' },
            { t: '④ image scan', b: '高危漏洞 = 0', c: 'ok', tag: '<span class=&quot;tag gray&quot;>21s</span>' },
            { t: '⑤ deploy staging', b: '滚动更新，不中断既有 SSE 流', c: 'purple', tag: '<span class=&quot;tag gray&quot;>38s</span>' },
          ]" />
        </UiCard>
        <UiCard title="Caddy / SSE 关键配置" desc="SSE 最常见的坑是代理缓冲">
          <pre v-html="caddy" />
        </UiCard>
      </div>
    </template>

    <template v-else-if="store.tabs.ops === 'backup'">
      <div class="grid g2">
        <UiCard title="备份与恢复" desc="AC-19-07：删掉数据卷后可用备份脚本恢复">
          <div class="spread"><span class="small">最近备份</span><span class="mono strong">2026-11-09 03:00</span></div>
          <div class="spread mt12"><span class="small">pgvector 体积</span><span class="mono strong">184 MB</span></div>
          <div class="spread mt12"><span class="small">MinIO 文档</span><span class="mono strong">7.3 MB</span></div>
          <div class="spread mt12"><span class="small">加密</span><UiTag color="ok">AES-256</UiTag></div>
          <div class="spread mt12"><span class="small">保留策略</span><span class="mono">7 日 / 4 周</span></div>
          <div class="divider" />
          <div class="row">
            <button class="btn primary" :disabled="store.backupRunning" @click="store.backupRunning = true; store.toast('备份任务已启动（演示）', 'ok')">
              {{ store.backupRunning ? '备份中…' : '▤ 立即备份' }}
            </button>
            <button class="btn" @click="store.restoreDone = true; store.toast('恢复演练通过（演示）', 'ok')">
              {{ store.restoreDone ? '恢复演练通过' : '⟲ 恢复演练' }}
            </button>
          </div>
          <div v-if="store.restoreDone" class="callout ok mt16">
            恢复演练通过：干净数据卷 → 解密 → pg_restore → 索引校验 → 问答回归，耗时 4分12秒。
          </div>
          <div v-else class="callout mt16" style="font-size: 11.5px">
            备份不做恢复演练 = 没有备份。面试一定要讲「我实测恢复过」。
          </div>
          <UiCode class="mt12" text="./scripts/backup.sh  pgvector + minio  → s3://bak/20261109&#10;./scripts/restore.sh 20261109 --verify" />
        </UiCard>

        <UiCard title="容量与压测" desc="NFR-01 / NFR-09">
          <UiTable
            :heads="['指标', '结果', '基线', '结论']"
            :rows="[
              ['SSE 并发', '128 路', '≥ 100', '<b>达标</b>'],
              ['TTFT P95', '1.42s', '≤ 2.5s', '达标'],
              ['10MB 文档解析', '38s', '≤ 60s', '达标'],
              ['错误率', '0.6%', '≤ 2%', '达标'],
              ['滚动更新断流', '0 次', '0', '达标'],
            ]"
          />
          <div class="small muted mt12">
            容量按 TPM 配额 × 0.7 安全系数估算；超出排队而不是打垮推理服务（vegeta 压测报告见 README）。
          </div>
        </UiCard>
      </div>
    </template>

    <template v-else-if="store.tabs.ops === 'runbook'">
      <UiTable :heads="['故障', '触发条件', '处置步骤', '关联页面', '演练']" :rows="RUNBOOKS.map(r => [
        `<b>${r[0]}</b>`, r[1], r[2], `<span class=&quot;mono tiny&quot;>${r[3]}</span>`, `<span class=&quot;tag ok&quot;>${r[4]}</span>`,
      ])">
        <template #tools><span class="small muted">五类故障 Runbook · 每类都有演练记录</span></template>
      </UiTable>
      <div class="grid g2 mt16">
        <UiCard title="演练记录 · 供应商故障" desc="可直接讲 10 分钟">
          <UiTimeline :items="[
            { t: 'T+0s', b: '注入 DeepSeek-V3 连续超时', c: 'danger' },
            { t: 'T+8s', b: '错误率告警触发，熔断 OPEN', c: 'warn' },
            { t: 'T+22s', b: '流量切至 qwen2:7b，用户看到琥珀降级提示', c: 'warn' },
            { t: 'T+31s', b: '半开探测成功，权重逐步回升', c: 'ok' },
            { t: 'T+2m', b: 'Runbook 归档 + 审计流水补齐', c: 'purple' },
          ]" />
        </UiCard>
        <UiCard title="部署形态演进" desc="先简单，再进阶">
          <div class="callout">
            W4 主线：<b>Docker Compose 一键起</b>（低成本、快速拿公网演示地址）。
            K8s + Helm + HPA 属于 P2 加分项，不在 4 周 Must 范围内 —— 但要在 README 写清楚「为什么先不上 K8s」。
          </div>
          <UiCode class="mt12" text="docker compose up -d        # 9 个服务&#10;curl -s localhost:8080/readyz  # ok&#10;vegeta attack -duration=60s    # 压测" />
        </UiCard>
      </div>
    </template>

    <template v-else>
      <UiCard title="Go / No-Go 上线检查单" :desc="`已完成 ${done} / ${CHECKS.length} 项 · 可勾选，进度实时计算（演示）`">
        <div class="spread">
          <span class="small muted">全部勾选才允许发布 PROD</span>
          <span class="tag" :class="done === CHECKS.length ? 'ok' : 'warn'">{{ pct }}%</span>
        </div>
        <div class="mt12"><UiBar :pct="pct" :color="done === CHECKS.length ? 'ok' : 'warn'" /></div>
        <div class="divider" />
        <UiCheck
          v-for="c in CHECKS" :key="c[0]"
          :label="c[1]" :fr="c[0]" :checked="!!store.checks[c[0]]"
          @toggle="store.toggleCheck(c[0])"
        />
        <div class="row mt16">
          <button class="btn sm" @click="CHECKS.forEach(c => { store.checks[c[0]] = true })">全部勾选</button>
          <button class="btn sm" @click="Object.keys(store.checks).forEach(k => { store.checks[k] = false })">清空</button>
          <button class="btn sm" @click="store.toast('检查单已导出（演示）', 'ok')">导出检查单</button>
        </div>
      </UiCard>

      <div class="grid g3 mt16">
        <UiCard title="交付物清单" desc="写进 GitHub README">
          <div v-for="x in ['架构图与分层说明', 'OpenAPI 接口文档', '部署手册（干净主机复现）', '压测报告（vegeta）', '线上演示地址与账号', '评测基线与门禁记录']" :key="x" class="spec-row">
            <UiTag color="ok">✓</UiTag><span>{{ x }}</span>
          </div>
        </UiCard>
        <UiCard title="README 结构" desc="第三人可复现">
          <UiCode text="01 项目定位 / 架构图&#10;02 快速启动 (compose up -d)&#10;03 接口文档 /api/*&#10;04 配置与环境变量&#10;05 评测与 CI 闸门&#10;06 监控 / 告警 / Runbook&#10;07 压测报告&#10;08 演示地址 · 简历叙事" />
        </UiCard>
        <UiCard title="AC-19 验收" desc="一句话结论">
          <div class="callout ok">
            一台干净云主机上 <span class="mono">docker compose up -d</span> 后可通过公网域名访问；
            删掉数据卷后可用备份脚本恢复；README 步骤可被第三人复现。
          </div>
          <div class="small muted mt12">这一条是把 4 周工作变成「可验证交付」而不是「本地能跑」的分界线。</div>
        </UiCard>
      </div>
    </template>
  </div>
</template>
