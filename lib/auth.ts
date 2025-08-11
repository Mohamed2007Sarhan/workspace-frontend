"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface User {
  id: number
  name: string
  email: string
  role: "admin" | "subscriber" | "user"
  phone?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem("auth_token", token)
        set({ user, token, isAuthenticated: true })
      },
      logout: () => {
        localStorage.removeItem("auth_token")
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: "auth-storage",
    },
  ),
)

export const hasRole = (user: User | null, roles: string[]): boolean => {
  return user ? roles.includes(user.role) : false
}

export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, ["admin"])
}

export const isSubscriber = (user: User | null): boolean => {
  return hasRole(user, ["subscriber"])
}
