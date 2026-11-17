<script setup lang="ts">
import PageHead from '@/components/PageHead.vue'
import UiCard from '@/components/ui/Card.vue'
import UiCheck from '@/components/ui/UiCheck.vue'
import UiKpi from '@/components/ui/UiKpi.vue'
import UiSwitch from '@/components/ui/UiSwitch.vue'
import UiTable from '@/components/ui/UiTable.vue'
import UiTabs from '@/components/ui/UiTabs.vue'
import UiTag from '@/components/ui/UiTag.vue'
import UiTimeline from '@/components/ui/UiTimeline.vue'
import { PAGE_META, SEC_INJECTIONS, SEC_ISOLATION, SEC_MEMBERS, WEEK } from '@/data/mock'
import { useConsole } from '@/stores/console'

const store = useConsole()
const meta = PAGE_META.security
const tabs = [
  { k: 'injection', label: '注入防护' },
  { k: 'rbac', label: '成员与 RBAC' },
  { k: 'isolation', label: '租户隔离' },
]

const injections = SEC_INJECTIONS as any[]

const members = SEC_MEMBERS as any[]

const iso = SEC_ISOLATION as any[]

const tenants = [
  { n: 'Acme 研发中心', id: 'acme-rd', c: '216 chunks' },
  { n: 'Beta 运营组', id: 'beta-ops', c: '98 chunks' },
  { n: '演示访客', id: 'demo-guest', c: '24 chunks' },
]
</script>

<template>
  <PageHead :title="meta.title" :sub="meta.sub" :fr="meta.fr" :week="WEEK.security" />

  <UiTabs v-model="store.tabs.security" :tabs="tabs" />

  <div class="mt16">
    <template v-if="store.tabs.security === 'injection'">
      <div class="grid g4">
        <UiKpi label="红队用例" value="42" unit="条" foot="100% 拦截 · NFR-04" color="ok" />
        <UiKpi label="今日拦截" value="1" unit="次" foot="beta-ops · INJ-03" color="warn" />
        <UiKpi label="越权事件" value="0" unit="次" foot="跨租户回归用例覆盖" color="ok" />
        <UiKpi label="日志脱敏" value="已启用" foot="手机号 / 邮箱 / 密钥" color="cyan" />
      </div>
      <div class="grid g2 mt16">
        <UiCard title="注入拦截记录" desc="输入输出双向校验">
          <UiTable :heads="['时间', '类型', '命中规则', '处置', '原文（脱敏）']" :rows="injections" />
        </UiCard>
        <UiCard title="四层防御" desc="面试标准答案">
          <UiTimeline :items="[
            { t: '① 输入层', b: '规则 + 分类器识别直接注入，可疑片段不进 Prompt', c: 'ok' },
            { t: '② 检索层', b: '文档视为不可信数据，清洗隐藏文本与指令型语句（防间接注入）', c: 'ok' },
            { t: '③ 隔离层', b: '工具最小权限、沙箱执行、第三方 MCP Server 准入评审', c: 'warn' },
            { t: '④ 输出层', b: 'JSON Schema 校验 + 敏感信息脱敏 + 审计留痕', c: 'purple' },
          ]" />
          <div class="callout mt12" style="font-size: 11.5px">
            关键认知：<b>RAG 检索回来的文档也是不可信输入</b>，不是只有用户提问才需要防注入。
          </div>
        </UiCard>
      </div>
    </template>

    <template v-else-if="store.tabs.security === 'rbac'">
      <UiTable :heads="['成员', '角色', '租户', '可见页面', '状态']" :rows="members">
        <template #tools>
          <span class="small muted">SRS 2.3 的五类角色，服务端强制 + 前端收敛</span>
          <button class="btn sm primary" style="margin-left: auto" @click="store.toast('邀请链接已生成（演示）', 'ok')">邀请成员</button>
        </template>
      </UiTable>
      <div class="grid g2 mt16">
        <UiCard title="角色切换预览" desc="右上角下拉可实时裁剪导航">
          <div class="callout">
            当前角色 <b>{{ store.roleName }}</b>，可见 {{ store.allowedViews?.length ?? 12 }} 个页面。
            切换后侧栏即时收敛，但真正的边界在服务端：所有检索都带 <span class="mono">tenant_id</span> 前置过滤。
          </div>
        </UiCard>
        <UiCard title="配额与冻结" desc="租户管理员可操作">
          <div class="spread"><span class="small">超预算自动降级</span><UiSwitch v-model="store.switches.autofail" /></div>
          <div class="spread mt12"><span class="small">审计只追加</span><UiSwitch v-model="store.switches.audit" /></div>
          <div class="spread mt12"><span class="small">日志脱敏</span><UiSwitch v-model="store.switches.desense" /></div>
          <div class="row mt16">
            <button class="btn sm danger" @click="store.toast('已触发二次确认（演示）', 'warn')">冻结租户</button>
          </div>
        </UiCard>
      </div>
    </template>

    <template v-else>
      <div class="grid g2">
        <UiCard title="租户隔离自查清单" desc="AC-17：A 租户无论怎么提问都检索不到 B 租户文档">
          <UiCheck
            v-for="x in iso" :key="x[0]"
            :label="`<b>${x[0]}</b> · ${x[1]}`" fr="FR-17" :checked="true"
            @toggle="store.toast('演示环境该项固定通过')"
          />
          <div class="callout ok mt12" style="font-size: 11.5px">6/6 通过 · 最近一次跨租户回归 17:40 · 0 次串数据</div>
        </UiCard>

        <UiCard title="租户切换" desc="演示多租户隔离">
          <div v-for="(x, i) in tenants" :key="x.id" class="spread" style="padding: 11px 0; border-bottom: 1px solid var(--line-2)">
            <div>
              <div class="small strong">{{ x.n }} <UiTag v-if="i === 0" color="info">当前</UiTag></div>
              <div class="tiny muted mono">{{ x.id }} · {{ x.c }}</div>
            </div>
            <button class="btn sm" @click="store.toast(`已切换到 ${x.id}（演示）`)">切换</button>
          </div>
          <div class="callout mt16" style="font-size: 11.5px">
            切换租户后：对话历史清空、缓存不复用、检索 namespace 改变 —— 这些都是面试里能现场演示的证据。
          </div>
        </UiCard>
      </div>
    </template>
  </div>
</template>
