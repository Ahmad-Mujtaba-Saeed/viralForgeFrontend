'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isInitialCheck, token } = useAppSelector((state) => state.auth)
  const router = useRouter()

  console.log('ProtectedRoute State:', { isAuthenticated, isLoading, isInitialCheck, token })

  useEffect(() => {
    console.log('ProtectedRoute useEffect:', { isAuthenticated, isLoading, isInitialCheck, token })
    // Only redirect if initial check is complete and user is not authenticated
    if (!isInitialCheck && !isLoading && !isAuthenticated && !token) {
      console.log('ProtectedRoute: Redirecting to login')
      router.push(redirectTo)
    }
  }, [isLoading, isAuthenticated, token, isInitialCheck, router, redirectTo])

  // Show loading during initial auth check or regular loading
  if (isInitialCheck || isLoading) {
    console.log('ProtectedRoute: Showing loading')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Only show null if not authenticated after initial check
  if (!isAuthenticated && !token) {
    console.log('ProtectedRoute: Showing null (not authenticated)')
    return null
  }

  console.log('ProtectedRoute: Showing children')
  return <>{children}</>
}
