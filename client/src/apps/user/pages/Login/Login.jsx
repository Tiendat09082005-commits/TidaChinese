import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../../../../auth/services/authService'
import Toast from '../../../../shared/components/Toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const navigate = useNavigate()
  
  // Status feedback states
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Floating background particles effect
  useEffect(() => {
    const container = document.getElementById('particles-container')
    if (!container) return

    container.innerHTML = ''
    const createdParticles = []
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div')
      particle.className = 'absolute pointer-events-none opacity-25'
      const size = Math.random() * 150 + 150
      particle.style.width = size + 'px'
      particle.style.height = size + 'px'
      particle.style.backgroundColor = i % 2 === 0 ? '#006e2f' : '#22c55e'
      particle.style.borderRadius = '50%'
      particle.style.left = Math.random() * 100 + '%'
      particle.style.top = Math.random() * 100 + '%'
      particle.style.filter = 'blur(60px)'

      container.appendChild(particle)
      createdParticles.push(particle)

      const duration = 15000 + Math.random() * 20000
      particle.animate([
        { transform: 'translate(0, 0) scale(1)' },
        { transform: `translate(${Math.random() * 300 - 150}px, ${Math.random() * 300 - 150}px) scale(1.15)` }
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
      setErrorMsg('Vui lòng điền đầy đủ email và mật khẩu!')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrorMsg('Email không đúng định dạng hợp lệ!')
      return
    }

    setIsLoading(true)
    try {
      const response = await login({ email, password })
      
      // Save user info and token to localStorage
      if (response.data.token) {
        localStorage.setItem('user_token', response.data.token)
        localStorage.setItem('user_profile', JSON.stringify(response.data.user))
        // Dispatch event to notify UserLayout immediately
        window.dispatchEvent(new Event('authChange'))
      }

      setSuccessMsg(response.data.message || 'Đăng nhập thành công!')
      
      // Redirect to Home after 1.5s
      setTimeout(() => {
        navigate('/')
      }, 1500)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ!')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f3fcef] text-[#161d16] flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Reusable Stateful Toast Feedbacks */}
      {errorMsg && <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />}
      {successMsg && <Toast message={successMsg} type="success" onClose={() => setSuccessMsg('')} />}

      {/* Background Particles Container */}
      <div id="particles-container" className="absolute inset-0 z-0"></div>

      {/* Header Branding */}
      <header className="absolute top-8 left-8 hidden md:block z-10">
        <Link to="/" className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
          <span className="material-symbols-outlined text-[#006e2f] text-3xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
          <span className="text-xl font-bold text-[#006e2f] tracking-tight">TidaChinese</span>
        </Link>
      </header>

      <main className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
        {/* Left Side: Decorative Illustration */}
        <div className="hidden lg:flex flex-col justify-center items-center text-center p-8 space-y-6">
          <div className="w-full transform hover:scale-[1.02] transition-transform duration-500">
            <img 
              alt="Chào mừng bạn quay lại với TidaChinese" 
              className="w-full h-auto drop-shadow-2xl max-w-md mx-auto" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGYkZr0-SGEi-NLOBpieukwvevfXQoYeQm3JHCX8A2bwELb5jG13mH5fBv_N7AyBleC-yDq9NJkgkh0g5KCwpBm7hKVsc_GcIVbmoWYZHaj3iKp2uwaYhJkIBgSp-cPulidprggN-GDQnKAYZn9JmN2XVuY-IfkkpJJtrKy7SdFh4gFRMOC_pX8xQIzu1dogvPts5hnHEhiohOjXz2QbXrdjWpF8fPOuadosQ4GfckSdWcXXL8K25JmpkVtNTucEoKESqCd4PNxyo"
            />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[#161d16]">Chào mừng bạn quay lại!</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Tiếp tục hành trình học tiếng Trung thông minh và nâng cao phản xạ giao tiếp mỗi ngày cùng chúng tôi.
            </p>
          </div>
        </div>

        {/* Right Side: Signin Card */}
        <div className="flex justify-center w-full">
          <div className="bg-white/95 backdrop-blur-md shadow-2xl w-full max-w-[480px] p-8 md:p-10 rounded-2xl border border-gray-200">
            <div className="mb-6 text-center">
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#161d16] mb-2">Đăng nhập tài khoản</h1>
              <p className="text-gray-500 text-sm">Điền thông tin tài khoản của bạn để tiếp tục.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#161d16]" htmlFor="email">Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">mail</span>
                  <input 
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-200 bg-gray-50/50 focus:border-[#006e2f] focus:ring-0 outline-none transition-all font-body-md" 
                    id="email" 
                    name="email" 
                    placeholder="email@example.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-[#161d16]" htmlFor="password">Mật khẩu</label>
                  <a className="text-xs font-bold text-[#006e2f] hover:underline" href="/auth/forgot-password">Quên mật khẩu?</a>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">lock</span>
                  <input 
                    className="w-full pl-11 pr-12 py-3 rounded-lg border border-gray-200 bg-gray-50/50 focus:border-[#006e2f] focus:ring-0 outline-none transition-all font-body-md" 
                    id="password" 
                    name="password" 
                    placeholder="••••••••" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#006e2f] transition-colors" type="button">
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {/* Remember Me Option */}
              <div className="flex items-center">
                <input id="remember_me" name="remember_me" type="checkbox" className="h-4 w-4 text-[#006e2f] focus:ring-[#006e2f]/20 border-gray-300 rounded" />
                <label htmlFor="remember_me" className="ml-2 block text-xs text-gray-700 font-semibold">Ghi nhớ đăng nhập</label>
              </div>
              
              {/* Submit Button */}
              <button 
                disabled={isLoading}
                className="w-full bg-[#006e2f] hover:bg-[#005321] disabled:bg-gray-300 text-white text-sm font-bold py-4 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 mt-2 flex items-center justify-center gap-2" 
                type="submit"
              >
                {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                Đăng nhập
              </button>
            </form>

            <div className="my-8 flex items-center gap-4">
              <div className="h-px bg-gray-200 flex-grow"></div>
              <span className="text-xs text-gray-400 uppercase tracking-wider whitespace-nowrap">Hoặc tiếp tục với</span>
              <div className="h-px bg-gray-200 flex-grow"></div>
            </div>

            {/* Social Options */}
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-700">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                Google
              </button>
              <button className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-700">
                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
                </svg>
                Facebook
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-500 text-sm">
                Chưa có tài khoản? 
                <a className="text-[#006e2f] font-bold hover:underline ml-1" href="/auth/register">Đăng ký ngay</a>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Copyright */}
      <footer className="mt-12 py-6 text-center w-full max-w-[1280px]">
        <p className="text-xs text-gray-400">
          © 2024 TidaChinese. Master Chinese with flow.
        </p>
      </footer>
    </div>
  )
}
