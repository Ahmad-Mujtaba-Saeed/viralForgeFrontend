'use client'

import axios from 'axios'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    Accept: 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    // Automatically handle FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    } else {
      config.headers['Content-Type'] = 'application/json'
    }

    console.log(
      'Axios Request:',
      config.method?.toUpperCase(),
      config.url
    )

    return config
  },
  (error) => {
    console.error('Axios Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(
      'Axios Response:',
      response.config.method?.toUpperCase(),
      response.config.url,
      'Status:',
      response.status
    )

    return response
  },
  (error) => {
    console.error(
      'Axios Response Error:',
      error.config?.method?.toUpperCase(),
      error.config?.url,
      'Status:',
      error.response?.status,
      'Data:',
      error.response?.data
    )

    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined'
    ) {
      localStorage.removeItem('token')

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api