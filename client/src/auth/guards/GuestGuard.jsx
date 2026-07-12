import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

export default function GuestGuard({ children }) {
  const location = useLocation()
  
  const userToken = localStorage.getItem('user_token')
  const userProfile = localStorage.getItem('user_profile')
  const adminToken = localStorage.getItem('admin_token')
  const adminProfile = localStorage.getItem('admin_profile')

  // Helper function to check if token is valid and unexpired
  const isTokenValid = (token, storedUser, expectedRoles) => {
    if (!token || !storedUser) return false
    try {
      const user = JSON.parse(storedUser)
      if (!expectedRoles.includes(user.role_id)) return false

      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Date.now() / 1000
      return payload.exp > currentTime
    } catch {
      return false
    }
  }

  const isAdminPath = location.pathname.startsWith('/admin')

  if (isAdminPath) {
    // If accessing admin login page, only redirect if already logged in as Admin
    if (isTokenValid(adminToken, adminProfile, [3, 4])) {
      return <Navigate to="/admin" replace />
    }
  } else {
    // If accessing client user login/register pages, only redirect if already logged in as normal User
    if (isTokenValid(userToken, userProfile, [1, 2])) {
      return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}
