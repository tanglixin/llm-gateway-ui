import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { login as loginAPI } from '@/api/client'
import { getToken, setToken } from '@/api/token'

export interface AuthUser {
  id: string
  email: string
  name: string
  tenant: string
  role: string
}

const USER_KEY = 'nova.user'

export const useAuth = defineStore('auth', () => {
  const stored = localStorage.getItem(USER_KEY)
  const token = ref(getToken())
  const user = ref<AuthUser | null>(stored ? (JSON.parse(stored) as AuthUser) : null)
  const error = ref('')
  const isAdmin = computed(() => user.value?.role === 'admin')
  const loading = ref(false)

  async function login(email: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = ''
    try {
      const res = await loginAPI(email, password)
      setToken(res.token)
      token.value = res.token
      user.value = res.user
      localStorage.setItem(USER_KEY, JSON.stringify(res.user))
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      return false
    } finally {
      loading.value = false
    }
  }

  function logout(): void {
    setToken('')
    token.value = ''
    user.value = null
    localStorage.removeItem(USER_KEY)
  }

  return { token, user, error, loading, isAdmin, login, logout }
})
