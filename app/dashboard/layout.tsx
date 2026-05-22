"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed || isMobile}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <Header sidebarCollapsed={sidebarCollapsed || isMobile} />
      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarCollapsed || isMobile ? 80 : 280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="pt-16 min-h-screen"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </motion.main>
    </div>
  )
}
