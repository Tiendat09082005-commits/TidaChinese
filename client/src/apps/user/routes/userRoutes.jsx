import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

// Pages
import Home from '../pages/Home'
import Profile from '../pages/Profile'
import Orders from '../pages/Orders'
import Cart from '../pages/Cart'
import ProductDetail from '../pages/ProductDetail'
import Pricing from '../pages/Pricing'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Radicals from '../pages/Radicals'
import Vocabulary from '../pages/Vocabulary'

// Guards & Layouts
import AuthGuard from '../../../auth/guards/AuthGuard'
import GuestGuard from '../../../auth/guards/GuestGuard'
import UserLayout from '../components/UserLayout'

// Unified routing tree for the User Portal
export const userAppRoutes = [
  // Public standalone pricing page
  {
    path: '/pricing',
    element: <Pricing />,
  },

  // Guest-only auth routes
  {
    path: '/auth',
    element: (
      <GuestGuard>
        <UserLayout>
          <Navigate to="/auth/login" replace={false} />
        </UserLayout>
      </GuestGuard>
    ),
  },
  {
    path: '/auth/login',
    element: (
      <GuestGuard>
        <Login />
      </GuestGuard>
    ),
  },
  {
    path: '/auth/register',
    element: (
      <GuestGuard>
        <Register />
      </GuestGuard>
    ),
  },

  // Protected application routes under AuthGuard and UserLayout
  {
    path: '/',
    element: (
      <AuthGuard>
        <UserLayout>
          <Outlet />
        </UserLayout>
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'orders',
        element: <Orders />,
      },
      {
        path: 'cart',
        element: <Cart />,
      },
      {
        path: 'product/:id',
        element: <ProductDetail />,
      },
      {
        path: 'radicals',
        element: <Radicals />,
      },
      {
        path: 'vocabulary',
        element: <Vocabulary />,
      },
    ],
  },
]
