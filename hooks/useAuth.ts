import { useDispatch, useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { loginUser, registerUser, logoutUser, getCurrentUser, clearError } from '@/store/authSlice'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export const useAuth = () => {
  const dispatch = useAppDispatch()
  const authState = useAppSelector((state) => state.auth)

  const login = async (credentials: { email: string; password: string }) => {
    return await dispatch(loginUser(credentials))
  }

  const register = async (userData: { name: string; email: string; phone: string; password: string; password_confirmation: string }) => {
    return await dispatch(registerUser(userData))
  }

  const logout = async () => {
    return await dispatch(logoutUser())
  }

  const fetchCurrentUser = async () => {
    return await dispatch(getCurrentUser())
  }

  const clearAuthError = () => {
    dispatch(clearError())
  }

  return {
    ...authState,
    login,
    register,
    logout,
    fetchCurrentUser,
    clearError: clearAuthError,
  }
}
