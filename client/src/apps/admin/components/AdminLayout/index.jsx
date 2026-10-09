import React, { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { logout as apiLogout } from '../../../../auth/services/authService'

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  // Load admin profile info dynamically
  const [adminName, setAdminName] = useState('Admin User')

  React.useEffect(() => {
    const stored = localStorage.getItem('admin_profile')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setAdminName(parsed.display_name || parsed.email || 'Admin User')
      } catch (e) {
        setAdminName('Admin User')
      }
    }
  }, [])

  // Set document title to TCAdmin on admin page load
  React.useEffect(() => {
    document.title = 'TCAdmin'
    return () => {
      document.title = 'TidaChinese'
    }
  }, [])

  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: 'dashboard', path: '/admin/dashboard' },
    { id: 'users', label: 'Quản lý người dùng', icon: 'group', path: '/admin/users' },
    { id: 'radicals', label: 'Quản lý bộ thủ', icon: 'shape_recognition', path: '/admin/radicals' },
    { id: 'vocabularies', label: 'Quản lý từ vựng', icon: 'dictionary', path: '/admin/vocabularies' },
    { id: 'courses', label: 'Khóa học', icon: 'import_contacts', path: '/admin/courses' },
    { id: 'reports', label: 'Báo cáo', icon: 'analytics', path: '/admin/reports' },
    { id: 'settings', label: 'Cài đặt', icon: 'settings', path: '/admin/settings' }
  ]

  return (
    <div className="bg-[#f3fcef] text-[#161d16] text-base relative min-h-screen overflow-hidden">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#f3fcef] border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link to="/admin/dashboard" className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-[#006e2f] text-3xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            <span className="text-xl font-black text-[#006e2f] tracking-tight">TCAdmin</span>
          </Link>
        </div>

        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button className="p-2 text-gray-500 hover:bg-gray-100 hover:text-[#006e2f] transition-all rounded-full">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 text-gray-500 hover:bg-gray-100 hover:text-[#006e2f] transition-all rounded-full">
              <span className="material-symbols-outlined">help</span>
            </button>
            <button className="p-2 text-gray-500 hover:bg-gray-100 hover:text-[#006e2f] transition-all rounded-full">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
          <div className="h-8 w-px bg-gray-200 mx-2"></div>
          
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-700">{adminName}</p>
              <p className="text-[11px] text-gray-400 font-semibold">Administrator</p>
            </div>
            <img 
              className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm" 
              alt="Admin Profile"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeFPvIyOj8V_hPCH86aE6eW_YrVXqcJ1aYi3T7EJ4J3wvfAjHpKpEnCXiRUh_k99hTLRBNZ425qEEcchEO9h5YDhcRWzxiaFz7b4DNaXOVdRqH4JpQ8n4OGTinluL4sQSIV2KoqmuYKRy97Ch50fuikFBPdqEYPFRxHZCeNyxQ-4HQJpswKistMNWloIZH35EQjfox8r9qPXI6zuWJJmat2g5TqnrUQ7NDmpT8Ehx4VWaKgzYv7K2txNuCXDv2KSkCB02fQitqFG4"
            />
          </div>
        </div>
      </header>

      {/* Sidebar & Content Wrapper */}
      <div className="flex pt-16 h-screen">
        {/* SideNavBar */}
        <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 flex flex-col border-r border-gray-200 bg-[#edf6ea]/50 shadow-sm z-40">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200/50">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded bg-[#006e2f] flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 font-semibold leading-none mt-1">TidaChinese Dashboard</p>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item) => {
              // Match exact for dashboard or startsWith for subroutes (e.g. /admin/users/detail/...)
              const isActive = item.id === 'dashboard'
                ? (location.pathname === item.path || location.pathname === '/admin')
                : location.pathname.startsWith(item.path)
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.id === 'dashboard'}
                  className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-all text-sm font-semibold ${
                    isActive 
                      ? 'bg-[#006e2f] text-white shadow-md shadow-[#006e2f]/20' 
                      : 'text-gray-600 hover:bg-[#006e2f]/5 hover:text-[#006e2f]'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              )
            })}

          </nav>

          {/* Footer CTA & Logout */}
          <div className="p-4 border-t border-gray-200/50 space-y-2">

            <button 
              onClick={async () => {
                try {
                  await apiLogout()
                } catch (e) {
                  console.warn('Admin backend logout failed or offline:', e)
                }
                localStorage.removeItem('admin_token')
                localStorage.removeItem('admin_profile')
                window.dispatchEvent(new Event('authChange'))
                navigate('/admin/login')
              }}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all text-sm font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="ml-64 flex-1 overflow-y-auto bg-[#f3fcef] p-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

