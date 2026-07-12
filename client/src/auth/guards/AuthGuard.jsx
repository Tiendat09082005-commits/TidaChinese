import React from 'react'
import { Navigate } from 'react-router-dom'

export default function AuthGuard({ children }) {
  const token = localStorage.getItem('user_token')
  const storedUser = localStorage.getItem('user_profile')

  if (!token || !storedUser) {
    return <Navigate to="/auth/login" replace />
  }

  try {
    const user = JSON.parse(storedUser)
    
    // Check if the user is a standard user (role_id 1) or teacher (role_id 2)
    if (user.role_id !== 1 && user.role_id !== 2) {
      localStorage.removeItem('user_token')
      localStorage.removeItem('user_profile')
      window.dispatchEvent(new Event('authChange'))
      return <Navigate to="/auth/login" replace />
    }

    // Decode JWT payload manually to verify expiration
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000

    if (payload.exp < currentTime) {
      // Expired session -> clear and redirect
      localStorage.removeItem('user_token')
      localStorage.removeItem('user_profile')
      window.dispatchEvent(new Event('authChange'))
      return <Navigate to="/auth/login" replace />
    }
  } catch (error) {
    // Malformed token or JSON object
    localStorage.removeItem('user_token')
    localStorage.removeItem('user_profile')
    window.dispatchEvent(new Event('authChange'))
    return <Navigate to="/auth/login" replace />
  }

  return <>{children}</>
}
