import React from 'react'
import { Outlet } from 'react-router-dom'

// Pages
import Dashboard from '../pages/Dashboard'
import UserManagement from '../pages/UserManagement'
import UserDetail from '../pages/UserManagement/UserDetail'
import ProductManagement from '../pages/ProductManagement'
import OrderManagement from '../pages/OrderManagement'
import Reports from '../pages/Reports'
import Settings from '../pages/Settings'
import AdminLogin from '../pages/Login/Login'
import RadicalManagement from '../pages/RadicalManagement'
import VocabManagement from '../pages/VocabManagement'

// Guards & Layouts
import AdminGuard from '../../../auth/guards/AdminGuard'
import GuestGuard from '../../../auth/guards/GuestGuard'
import AdminLayout from '../components/AdminLayout'

// Unified routing tree for the Admin Portal
export const adminAppRoutes = [
  {
    path: '/admin',
    children: [
      // Public guest login page for Admin
      {
        path: 'login',
        element: (
          <GuestGuard>
            <AdminLogin />
          </GuestGuard>
        ),
      },
      // Protected dashboard and management pages
      {
        path: '',
        element: (
          <AdminGuard>
            <AdminLayout>
              <Outlet />
            </AdminLayout>
          </AdminGuard>
        ),
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'users',
            element: <UserManagement />,
          },
          {
            path: 'users/detail/:id',
            element: <UserDetail />,
          },
          {
            path: 'products',
            element: <ProductManagement />,
          },
          {
            path: 'orders',
            element: <OrderManagement />,
          },
          {
            path: 'reports',
            element: <Reports />,
          },
          {
            path: 'settings',
            element: <Settings />,
          },
          {
            path: 'radicals',
            element: <RadicalManagement />,
          },
          {
            path: 'vocabularies',
            element: <VocabManagement />,
          },
        ],
      },
    ],
  },
]
