"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Zap, Settings, LogOut, User as UserIcon, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useBilling } from "@/hooks/useBilling"
import { useAuth } from "@/hooks/useAuth"

interface HeaderProps {
  sidebarCollapsed: boolean
}

/** Derive up-to-two-letter initials from a display name or email. */
function initialsFrom(name?: string | null, email?: string | null): string {
  const source = (name || email || "").trim()
  if (!source) return "U"
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

export function Header({ sidebarCollapsed }: HeaderProps) {
  const { credits, hasSubscription, fetchBilling } = useBilling()
  const { user, logout } = useAuth()
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    fetchBilling().catch(() => {})
  }, [fetchBilling])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    router.push(q ? `/dashboard/videos?q=${encodeURIComponent(q)}` : "/dashboard/videos")
  }

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      router.push("/login")
    }
  }

  const displayName = user?.name || "Your account"
  const displayEmail = user?.email || ""
  const initials = initialsFrom(user?.name, user?.email)

  return (
    <header
      className="fixed top-0 right-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-xl transition-all duration-300"
      style={{ left: sidebarCollapsed ? 80 : 280 }}
    >
      <div className="flex h-full items-center justify-between px-6">
        <form onSubmit={handleSearch} className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink3" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search videos, projects..."
              className="h-10 pl-10 rounded-xl bg-card border border-border shadow-soft focus-visible:ring-1"
            />
          </div>
        </form>

        <div className="flex items-center gap-2.5">
          {/* Credits pill — links to billing. Shows "Subscribe" when none. */}
          <Link
            href="/dashboard/billing"
            className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-accent-soft border border-accent-line text-accent font-semibold text-sm shadow-soft hover:bg-accent-soft/80 transition-colors"
            title={hasSubscription ? "Your remaining credits" : "Subscribe to get credits"}
          >
            <Zap className="h-4 w-4 fill-current" />
            {hasSubscription ? (
              <span>{credits.toLocaleString()} <span className="hidden sm:inline font-medium text-ink3">credits</span></span>
            ) : (
              <span>Subscribe</span>
            )}
          </Link>

          <ThemeToggle />

          {/* Profile dropdown — dynamic user, settings + logout */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--chart-1)] to-[var(--chart-5)] flex items-center justify-center text-sm font-bold text-white shadow-soft outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Open account menu"
              >
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground truncate">{displayName}</span>
                {displayEmail && (
                  <span className="text-xs font-normal text-muted-foreground truncate">{displayEmail}</span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/help" className="cursor-pointer">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  handleLogout()
                }}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {loggingOut ? "Logging out…" : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
