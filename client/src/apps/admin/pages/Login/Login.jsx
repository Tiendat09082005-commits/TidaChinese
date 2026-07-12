import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminLogin } from '../../../../auth/services/authService'
import Toast from '../../../../shared/components/Toast'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()

  // Floating background particles effect tailored for admin (darker Slate/Emerald vibe)
  useEffect(() => {
    const container = document.getElementById('admin-particles-container')
    if (!container) return

    container.innerHTML = ''
    const createdParticles = []
    
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div')
      particle.className = 'absolute pointer-events-none opacity-20'
      const size = Math.random() * 150 + 150
      particle.style.width = size + 'px'
      particle.style.height = size + 'px'
      // Dark slate / emerald tones
      particle.style.backgroundColor = i % 2 === 0 ? '#0f766e' : '#047857'
      particle.style.borderRadius = '50%'
      particle.style.left = Math.random() * 100 + '%'
      particle.style.top = Math.random() * 100 + '%'
      particle.style.filter = 'blur(60px)'

      container.appendChild(particle)
      createdParticles.push(particle)

      const duration = 15000 + Math.random() * 20000
      particle.animate([
        { transform: 'translate(0, 0) scale(1)' },
        { transform: `translate(${Math.random() * 300 - 150}px, ${Math.random() * 300 - 150}px) scale(1.1)` }
      ], {
        duration: duration,
        iterations: Infinity,
        direction: 'alternate',
        easing: 'ease-in-out'
      })
    }

    return () => {
      createdParticles.forEach(p => {
        if (container.contains(p)) {
          container.removeChild(p)
        }
      })
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ email và mật khẩu quản trị!')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Email không đúng định dạng hợp lệ!')
      return
    }

    setIsLoading(true)
    try {
      const response = await adminLogin({ email, password })

      const user = response.data.user
      if (!user || (user.role_id !== 3 && user.role_id !== 4)) {
        setErrorMsg('Tài khoản của bạn không có quyền truy cập trang quản trị!')
        setIsLoading(false)
        return
      }

      // Save credentials for Admin session
      localStorage.setItem('admin_token', response.data.token)
      localStorage.setItem('admin_profile', JSON.stringify(user))
      window.dispatchEvent(new Event('authChange'))

      setSuccessMsg('Đăng nhập quản trị viên thành công! Đang chuyển hướng...')
      
      setTimeout(() => {
        navigate('/admin')
      }, 1500)

    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ!')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f1f5f9] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Particles Container */}
      <div id="admin-particles-container" className="absolute inset-0 z-0"></div>

      {/* Reusable Stateful Toast Feedbacks */}
      {errorMsg && <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />}
      {successMsg && <Toast message={successMsg} type="success" onClose={() => setSuccessMsg('')} />}

      <main className="w-full max-w-[460px] z-10">
        <div className="bg-[#1e293b]/90 backdrop-blur-md shadow-2xl border border-slate-700/50 p-8 md:p-10 rounded-2xl">
          {/* Header Brand */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 mb-4">
              <span className="material-symbols-outlined text-3xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">Hệ Thống Quản Trị</h1>
            <p className="text-slate-400 text-sm">Đăng nhập tài khoản Admin TidaChinese</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300" htmlFor="admin-email">Email quản trị</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                <input 
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 outline-none transition-all text-sm" 
                  id="admin-email" 
                  name="email" 
                  placeholder="admin@tidachinese.com" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300" htmlFor="admin-password">Mật khẩu</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                <input 
                  className="w-full pl-11 pr-12 py-3 rounded-lg border border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 outline-none transition-all text-sm" 
                  id="admin-password" 
                  name="password" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-400 transition-colors" type="button">
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              disabled={isLoading}
              className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 text-white text-sm font-bold py-4 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 mt-2 flex items-center justify-center gap-2" 
              type="submit"
            >
              {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              Đăng nhập Hệ thống
            </button>
          </form>

          {/* Footer Back Link */}
          <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
            <Link className="text-teal-400 font-bold hover:underline text-sm flex items-center justify-center gap-1.5" to="/">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Quay lại Trang chủ
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Copyright */}
      <footer className="mt-12 py-6 text-center w-full max-w-[1280px]">
        <p className="text-xs text-slate-500">
          © 2024 TidaChinese. Secure Administration Portal.
        </p>
      </footer>
    </div>
  )
}
