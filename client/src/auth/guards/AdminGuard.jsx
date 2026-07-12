import React from 'react'
import { Navigate } from 'react-router-dom'

export default function AdminGuard({ children }) {
  const token = localStorage.getItem('admin_token')
  const storedUser = localStorage.getItem('admin_profile')

  if (!token || !storedUser) {
    return <Navigate to="/admin/login" replace />
  }

  try {
    const user = JSON.parse(storedUser)
    
    // Check if the user is an admin (role_id 3) or superadmin (role_id 4)
    if (user.role_id !== 3 && user.role_id !== 4) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_profile')
      window.dispatchEvent(new Event('authChange'))
      return <Navigate to="/admin/login" replace />
    }

    // Decode JWT payload manually to verify expiration
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000

    if (payload.exp < currentTime) {
      // Expired session -> clear and redirect
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_profile')
      window.dispatchEvent(new Event('authChange'))
      return <Navigate to="/admin/login" replace />
    }
  } catch (error) {
    // Malformed token or JSON object
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_profile')
    window.dispatchEvent(new Event('authChange'))
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}
