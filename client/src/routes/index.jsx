import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

// Sub-module Routes
import { userAppRoutes } from '../apps/user/routes/userRoutes'
import { adminAppRoutes } from '../apps/admin/routes/adminRoutes'

export const router = createBrowserRouter([
  // Merge user application routes
  ...userAppRoutes,

  // Merge admin application routes
  ...adminAppRoutes,

  // Fallback redirect route
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
export default router
