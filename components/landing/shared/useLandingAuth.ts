"use client"

import { useEffect, useState } from "react"
import { useAppSelector } from "@/hooks/useAuth"

/**
 * Auth state for the (server-rendered) marketing landing page.
 *
 * The server always renders the logged-out state, so we gate anything
 * auth-dependent behind a `ready` (mounted) flag. The first client render
 * matches the server (logged-out), then we reveal the real state after mount —
 * no hydration mismatch, just a swap once we know who's signed in.
 */
export function useLandingAuth() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { isAuthenticated, user } = useAppSelector((s) => s.auth)

  const firstName = user?.name ? user.name.trim().split(/\s+/)[0] : ""
  const initials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p: string) => p[0]?.toUpperCase() ?? "")
        .join("")
    : ""

  return {
    ready: mounted,
    isAuthenticated: mounted && !!isAuthenticated,
    user: mounted ? user : null,
    firstName,
    initials,
  }
}
