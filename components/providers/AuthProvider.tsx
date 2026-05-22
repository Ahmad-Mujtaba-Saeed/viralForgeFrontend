'use client'

import { useEffect } from 'react'
import { useAppDispatch } from '@/hooks/useAuth'
import { getCurrentUser, clearAuth } from '@/store/authSlice'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token')
      console.log('AuthProvider: Token found:', !!token)
      if (token) {
        try {
          console.log('AuthProvider: Calling getCurrentUser...')
          await dispatch(getCurrentUser()).unwrap()
          console.log('AuthProvider: getCurrentUser success')
        } catch (error) {
          console.error('AuthProvider: getCurrentUser failed:', error)
          // If getCurrentUser fails, clear the auth state
          dispatch(clearAuth())
        }
      } else {
        console.log('AuthProvider: No token found')
      }
    }

    initializeAuth()
  }, [dispatch])

  return <>{children}</>
}
