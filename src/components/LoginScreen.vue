<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/stores/auth'

const auth = useAuth()
const email = ref('tang@acme.dev')
const password = ref('gateway')

async function submit(): Promise<void> {
  const ok = await auth.login(email.value.trim(), password.value)
  if (ok) window.location.hash = '#/overview'
}

function fill(e: string): void {
  email.value = e
  password.value = 'gateway'
}
</script>

<template>
  <div class="login-wrap">
    <form class="login-card" @submit.prevent="submit">
      <div class="brand-row">
        <div class="brand-mark">LLM</div>
        <div>
          <div class="brand-name">LLM Gateway</div>
          <div class="brand-sub">CONSOLE · 控制台</div>
        </div>
      </div>

      <h1>登录</h1>
      <p class="muted small">演示账号已预填，密码均为 <span class="mono">gateway</span></p>

      <label class="field-l">邮箱</label>
      <input v-model="email" class="inp" type="email" autocomplete="username" />

      <label class="field-l mt12">密码</label>
      <input v-model="password" class="inp" type="password" autocomplete="current-password" />

      <div v-if="auth.error" class="login-err">{{ auth.error }}</div>

      <button class="btn primary" style="width: 100%; margin-top: 16px" :disabled="auth.loading">
        {{ auth.loading ? '登录中…' : '登录' }}
      </button>

      <div class="demo-accounts">
        <button type="button" class="btn sm" @click="fill('tang@acme.dev')">acme-rd · 6 份文档</button>
        <button type="button" class="btn sm" @click="fill('demo@acme.dev')">demo-guest · 空租户</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(1200px 600px at 20% 0%, #eef2ff 0%, #f6f7fb 55%, #f6f7fb 100%);
  padding: 24px;
}
.login-card {
  width: 360px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 26px 26px 22px;
  box-shadow: 0 18px 48px rgba(17, 24, 39, 0.08);
}
.brand-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}
.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--brand);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
}
.brand-name {
  font-weight: 700;
  font-size: 14px;
}
.brand-sub {
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ink-3);
}
h1 {
  font-size: 20px;
  margin: 0 0 4px;
}
.login-err {
  margin-top: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 12px;
}
.demo-accounts {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed var(--line);
}
.demo-accounts .btn {
  flex: 1;
  font-size: 11px;
}
</style>
