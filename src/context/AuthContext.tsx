/* oxlint-disable react/only-export-components */
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { audioAssetsApi } from '../services/audioAssetsApi'
import type { User } from '../types/audioAssets'

type RegisterInput = {
  username: string
  email?: string
  displayName?: string
  password: string
}

type AuthContextValue = {
  user: User | null
  ready: boolean
  login: (usernameOrEmail: string, password: string) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  const logout = useCallback(() => {
    window.localStorage.removeItem('access_token')
    setUser(null)
  }, [])

  useEffect(() => {
    const token = window.localStorage.getItem('access_token')
    if (!token) {
      setReady(true)
      return
    }
    audioAssetsApi.getMe()
      .then(setUser)
      .catch(logout)
      .finally(() => setReady(true))
  }, [logout])

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    const response = await audioAssetsApi.login(usernameOrEmail, password)
    window.localStorage.setItem('access_token', response.access_token)
    setUser(response.user)
    await audioAssetsApi.getDefaultProject(response.user.user_id)
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    await audioAssetsApi.register({
      username: input.username,
      email: input.email || undefined,
      display_name: input.displayName || undefined,
      password: input.password,
    })
    await login(input.username, input.password)
  }, [login])

  const value = useMemo(() => ({ user, ready, login, register, logout }), [user, ready, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
