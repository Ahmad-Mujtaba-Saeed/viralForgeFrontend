"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Flame,
  LayoutDashboard,
  Video,
  Wand2,

  FolderOpen,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  LayoutTemplate,
  CreditCard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const mainNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Video, label: "My Videos", href: "/dashboard/videos" },
  { icon: LayoutTemplate, label: "Templates", href: "/dashboard/templates" },
  { icon: FolderOpen, label: "Projects", href: "/dashboard/projects" },
  { icon: Wand2, label: "AI Explainer Video", href: "/dashboard/explainer" },
  { icon: CreditCard, label: "Billing & Credits", href: "/dashboard/billing" },
]

const adminNavItem = { icon: BarChart3, label: "AI Costs", href: "/dashboard/admin/costs" }

const bottomNavItems = [
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { icon: HelpCircle, label: "Help", href: "/dashboard/help" },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const navItems = user?.is_admin ? [...mainNavItems, adminNavItem] : mainNavItems

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 z-40 h-screen flex flex-col bg-sidebar border-r border-sidebar-border"
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary shadow-soft">
              <Flame className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="font-display text-xl font-semibold tracking-tight text-sidebar-foreground overflow-hidden whitespace-nowrap"
                >
                  ViralForge
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Create Button */}
        <div className="p-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                className={cn(
                  "w-full rounded-xl bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground font-semibold shadow-soft",
                  collapsed ? "justify-center px-0" : "justify-start gap-2"
                )}
              >
                <Link href="/dashboard/templates">
                  <Plus className="h-4 w-4" />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        New Video
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                <p>New Video</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                          isActive
                            ? "bg-card text-primary shadow-soft border border-sidebar-border"
                            : "text-sidebar-foreground/70 hover:bg-card/60 hover:text-sidebar-foreground",
                          collapsed && "justify-center px-0"
                        )}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <AnimatePresence mode="wait">
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: "auto" }}
                              exit={{ opacity: 0, width: 0 }}
                              className="overflow-hidden whitespace-nowrap"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Link>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right">
                        <p>{item.label}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom Navigation */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <ul className="space-y-1">
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                          isActive
                            ? "bg-card text-primary shadow-soft border border-sidebar-border"
                            : "text-sidebar-foreground/70 hover:bg-card/60 hover:text-sidebar-foreground",
                          collapsed && "justify-center px-0"
                        )}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <AnimatePresence mode="wait">
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: "auto" }}
                              exit={{ opacity: 0, width: 0 }}
                              className="overflow-hidden whitespace-nowrap"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Link>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right">
                        <p>{item.label}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </li>
              )
            })}
          </ul>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
