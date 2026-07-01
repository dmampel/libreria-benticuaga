"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  createElement,
} from "react"

// ============ TYPES ============

interface AuthUser {
  id: string
  email: string
  role: string
  isAdmin?: boolean
  firstName?: string
  lastName?: string
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  login: (user: AuthUser) => void
  logout: () => void
}

// ============ CONTEXT ============

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
})

// ============ PROVIDER ============

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.success) setUser(data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback((userData: AuthUser) => {
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    setUser(null)
  }, [])

  return createElement(
    AuthContext.Provider,
    { value: { user, loading, isAuthenticated: user !== null, login, logout } },
    children
  )
}

// ============ HOOK ============

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
