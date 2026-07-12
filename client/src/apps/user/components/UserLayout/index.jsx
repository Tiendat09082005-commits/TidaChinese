import React, { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { logout as apiLogout } from '../../../../auth/services/authService'

export default function UserLayout({ children }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeMenu, setActiveMenu] = useState('home')
  const [user, setUser] = useState(null)

  // Listen to authentication changes
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user_profile')
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (e) {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    }
    checkAuth()
    window.addEventListener('authChange', checkAuth)
    return () => window.removeEventListener('authChange', checkAuth)
  }, [])

  // Track scrolling of the main content canvas
  const handleScroll = (e) => {
    if (e.target.scrollTop > 20) {
      setIsScrolled(true)
    } else {
      setIsScrolled(false)
    }
  }

  const menuItems = [
    { id: 'home', label: 'Trang chủ', icon: 'home', path: '/' },
    { id: 'radicals', label: 'Bộ thủ', icon: 'shape_recognition', path: '/radicals' },
    { id: 'vocabulary', label: 'Từ vựng', icon: 'menu_book', path: '/vocabulary' }
  ]

  return (
    <div className="bg-[#f3fcef] text-[#161d16] text-base relative min-h-screen">
      {/* Background Particles */}
      <div className="particle bg-green-200/30 w-64 h-64 top-[10%] left-[5%]" style={{ animationDelay: '-2s' }}></div>
      <div className="particle bg-purple-200/30 w-80 h-80 top-[40%] right-[10%]" style={{ animationDelay: '-5s' }}></div>
      <div className="particle bg-blue-200/30 w-48 h-48 bottom-[20%] left-[20%]" style={{ animationDelay: '-8s' }}></div>

      {/* TOP APP BAR */}
      <header className={`fixed top-0 left-0 w-full z-50 bg-[#f3fcef]/80 backdrop-blur-md transition-all duration-300 h-16 ${isScrolled ? 'shadow-md bg-[#f3fcef]/95 border-b border-[#006e2f]/10' : 'border-b border-transparent'}`}>
        <div className="flex items-center justify-between px-8 md:px-12 h-full w-full">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-[#006e2f] text-3xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            <span className="text-2xl font-black text-[#006e2f] tracking-tight">TidaChinese</span>
          </Link>
          {/* Search Bar - Expanded width */}
          <div className="hidden md:flex flex-1 max-w-3xl mx-10">
            <div className="relative w-full group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#006e2f] transition-colors">search</span>
              <input className="w-full bg-[#edf6ea] border-none rounded-full py-2 pl-12 pr-4 focus:ring-2 focus:ring-[#006e2f]/20 focus:bg-white transition-all text-base outline-none" placeholder="Tìm kiếm từ vựng, Hán tự..." type="text"/>
            </div>
          </div>
          {/* Auth Actions - Vietnamese */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative group">
                <Link to="/profile" className="px-5 py-2 rounded-full bg-[#006e2f] text-white text-sm font-bold hover:bg-[#005321] transition-all flex items-center gap-2 cursor-pointer shadow-md select-none">
                  <span className="material-symbols-outlined text-lg">account_circle</span>
                  <span>{user.display_name || user.email}</span>
                </Link>
                {/* Simple Dropdown Menu */}
                <div className="absolute right-0 pt-2 w-48 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                  <div className="bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                    <Link 
                      to="/profile"
                      className="w-full text-left px-4 py-2.5 hover:bg-[#e8f5e9] text-gray-700 text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer border-b border-gray-100"
                    >
                      <span className="material-symbols-outlined text-sm">person</span>
                      Trang cá nhân
                    </Link>
                    <button 
                      onClick={async () => {
                        try {
                          // Call backend logout API to notify server
                          await apiLogout()
                        } catch (e) {
                          console.warn('Backend logout failed or offline:', e)
                        }
                        // Clear client session
                        localStorage.removeItem('user_token')
                        localStorage.removeItem('user_profile')
                        window.dispatchEvent(new Event('authChange'))
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">logout</span>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link to="/auth/login" className="px-6 py-1.5 rounded-full border border-[#006e2f] text-[#006e2f] text-sm font-semibold hover:bg-[#006e2f]/5 active:scale-95 transition-all duration-200 whitespace-nowrap">
                  Đăng nhập
                </Link>
                <Link to="/auth/register" className="px-6 py-1.5 rounded-full bg-[#006e2f] text-white text-sm font-semibold hover:bg-[#005321] shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 whitespace-nowrap">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* SIDE NAVIGATION */}
      <aside className={`fixed left-0 top-16 h-[calc(100vh-64px)] bg-[#f3fcef] hidden md:flex flex-col p-4 border-r border-[#outline-variant]/10 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex-1 space-y-2 overflow-hidden">
          {!isCollapsed && (
            <div className="px-2 py-1 mb-4 transition-opacity duration-300">
              <h2 className="text-xl font-black text-[#006e2f]">Learning Hub</h2>
              <p className="text-gray-500 text-xs font-semibold">Level 1 Learner</p>
            </div>
          )}
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) => `flex items-center gap-4 p-4 w-full rounded-xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-[#006e2f] text-white font-bold shadow-md shadow-[#006e2f]/20 scale-[1.02]' 
                    : 'text-gray-600 hover:bg-[#006e2f]/5 hover:text-[#006e2f] hover:translate-x-1'
                }`}
              >
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#006e2f]'}`} style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                      {item.icon}
                    </span>
                    {!isCollapsed && <span className="text-sm font-semibold text-left">{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Upgrade Card */}
        {!isCollapsed && (
          <Link to="/pricing" className="block p-4 bg-[#f0dbff] text-[#6900b3] rounded-2xl shadow-sm border border-[#ddb7ff] hover:shadow-md hover:scale-[1.02] active:scale-98 transition-all cursor-pointer group mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#842bd2] animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
              <span className="text-[13px] font-bold uppercase tracking-wider">Nâng cấp gói</span>
            </div>
            <p className="text-[11px] opacity-90 leading-tight text-purple-900">Mở khoá toàn bộ tính năng học cao cấp ngay hôm nay.</p>
          </Link>
        )}

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="flex items-center gap-4 p-4 text-gray-500 hover:bg-[#006e2f]/5 hover:text-[#006e2f] rounded-xl transition-all w-full active:scale-95"
        >
          <span className="material-symbols-outlined transform transition-transform duration-300">
            {isCollapsed ? 'menu' : 'menu_open'}
          </span>
          {!isCollapsed && <span className="text-sm font-semibold">Collapse</span>}
        </button>
      </aside>

      {/* MAIN CONTENT CANVAS */}
      <main 
        onScroll={handleScroll} 
        className={`pt-16 h-screen custom-scrollbar overflow-y-auto transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}`}
      >
        {children}
      </main>

      {/* FAB for quick action on mobile */}
      <button className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#006e2f] text-white rounded-full shadow-2xl flex items-center justify-center z-50 active:scale-90 transition-transform">
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  )
}
