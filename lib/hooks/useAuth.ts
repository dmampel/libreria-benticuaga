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

const TOKEN_KEY = "auth_token"
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

// ============ TYPES ============

interface AuthUser {
  id: string
  email: string
  role: string
  firstName?: string
  lastName?: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

// ============ COOKIE HELPERS ============

function setAuthCookie(token: string) {
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

function clearAuthCookie() {
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`
}

// ============ TOKEN PARSER ============

function parseToken(token: string | null): AuthUser | null {
  if (!token) return null
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))
    if (!decoded.id || !decoded.email || !decoded.role) return null
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    }
  } catch {
    return null
  }
}

// ============ CONTEXT ============

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
})

// ============ PROVIDER ============

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)

  // Read token from localStorage on mount + sync cookie
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    const parsed = parseToken(stored)
    if (parsed && stored) {
      setToken(stored)
      setUser(parsed)
      setAuthCookie(stored) // ensure cookie is in sync
    } else if (stored) {
      localStorage.removeItem(TOKEN_KEY)
      clearAuthCookie()
    }
  }, [])

  // Multi-tab sync: storage event fires when OTHER tabs change localStorage
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key !== TOKEN_KEY) return
      const parsed = parseToken(e.newValue)
      if (parsed && e.newValue) {
        setToken(e.newValue)
        setUser(parsed)
        setAuthCookie(e.newValue)
      } else {
        setToken(null)
        setUser(null)
        clearAuthCookie()
      }
    }
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const login = useCallback((newToken: string) => {
    const parsed = parseToken(newToken)
    if (!parsed) return
    localStorage.setItem(TOKEN_KEY, newToken)
    setAuthCookie(newToken)
    setToken(newToken)
    setUser(parsed)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    clearAuthCookie()
    setToken(null)
    setUser(null)
  }, [])

  return createElement(
    AuthContext.Provider,
    { value: { user, token, isAuthenticated: user !== null, login, logout } },
    children
  )
}

// ============ HOOK ============

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
