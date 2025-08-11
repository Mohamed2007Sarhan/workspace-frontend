"use client"

import type React from "react"

import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
}

export function ProtectedRoute({ children, requiredRoles = [] }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login")
      return
    }

    if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
      router.push("/app/dashboard")
      return
    }
  }, [isAuthenticated, user, requiredRoles, router])

  if (!isAuthenticated) {
    return null
  }

  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
