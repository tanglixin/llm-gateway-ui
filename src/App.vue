<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import AppTopbar from '@/components/AppTopbar.vue'
import CommandPalette from '@/components/CommandPalette.vue'
import DrawerPanel from '@/components/DrawerPanel.vue'
import ToastHost from '@/components/ToastHost.vue'
import LoginScreen from '@/components/LoginScreen.vue'
import { useAuth } from '@/stores/auth'
const route = useRoute()
const auth = useAuth()

const viewKey = computed(() => (route.path === '/' ? 'overview' : route.path.slice(1)))
</script>

<template>
  <LoginScreen v-if="!auth.token" />

  <div v-else class="app">
    <AppSidebar :active="viewKey" />
    <div class="main">
      <AppTopbar :active="viewKey" />
      <main class="content">
        <RouterView />
      </main>
    </div>

    <DrawerPanel />
    <CommandPalette />
    <ToastHost />
  </div>
</template>
