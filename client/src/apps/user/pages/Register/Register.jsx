import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../../../../auth/services/authService'
import Toast from '../../../../shared/components/Toast'

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const totalSteps = 5

  // Step 1: Account Setup States
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Step 2: Learning Goals States
  const [learningGoals, setLearningGoals] = useState([])
  const [customGoal, setCustomGoal] = useState('')

  // Step 3: HSK level Target State
  const [hskGoalLevel, setHskGoalLevel] = useState(3)

  // Step 4: Daily Commitment Minutes States
  const [dailyGoalMin, setDailyGoalMin] = useState(15)
  const [customDailyMin, setCustomDailyMin] = useState('')
  const [isCustomDaily, setIsCustomDaily] = useState(false)

  // Step 5: Settings Preferences
  const [dialectPref, setDialectPref] = useState('beijing')
  const [customDialect, setCustomDialect] = useState('')
  const [isCustomDialect, setIsCustomDialect] = useState(false)
  const [notifyTime, setNotifyTime] = useState('20:00')
  const [darkMode, setDarkMode] = useState(false)

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

  const toggleLearningGoal = (val) => {
    if (learningGoals.includes(val)) {
      setLearningGoals(learningGoals.filter(item => item !== val))
    } else {
      setLearningGoals([...learningGoals, val])
    }
  }

  const handleNext = (e) => {
    if (e) e.preventDefault()
    setErrorMsg('')

    // Step 1 validation
    if (step === 1) {
      if (!displayName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
        setErrorMsg('Vui lòng điền đầy đủ tất cả các trường dữ liệu tài khoản!')
        return
      }
      if (displayName.trim().length < 2) {
        setErrorMsg('Tên hiển thị phải dài ít nhất 2 ký tự!')
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setErrorMsg('Email không đúng định dạng hợp lệ!')
        return
      }
      if (password.length < 6) {
        setErrorMsg('Mật khẩu phải chứa ít nhất 6 ký tự!')
        return
      }
      if (password !== confirmPassword) {
        setErrorMsg('Mật khẩu và xác nhận mật khẩu không trùng khớp!')
        return
      }
    }

    // Step 2 validation
    if (step === 2) {
      if (learningGoals.length === 0) {
        setErrorMsg('Vui lòng chọn ít nhất một mục tiêu học tập!')
        return
      }
      if (learningGoals.includes('other') && !customGoal.trim()) {
        setErrorMsg('Vui lòng điền cụ thể mục tiêu học tập khác của bạn!')
        return
      }
    }

    // Step 4 validation
    if (step === 4) {
      if (isCustomDaily && (!customDailyMin || parseInt(customDailyMin) <= 0)) {
        setErrorMsg('Vui lòng điền số phút học mỗi ngày hợp lệ!')
        return
      }
    }

    setStep((prev) => Math.min(prev + 1, totalSteps))
  }

  const handlePrev = () => {
    setErrorMsg('')
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    // Final Step (Step 5) input check
    if (isCustomDialect && !customDialect.trim()) {
      setErrorMsg('Vui lòng nhập giọng địa phương bạn mong muốn!')
      setIsLoading(false)
      return
    }

    // Prepare processed variables
    const finalGoalsList = learningGoals
      .map(g => g === 'other' ? customGoal.trim() : g)
      .filter(Boolean)
    const combinedGoals = finalGoalsList.join(',').slice(0, 50)

    const finalDailyMin = isCustomDaily ? parseInt(customDailyMin) : dailyGoalMin
    const finalDialect = isCustomDialect ? customDialect.trim().slice(0, 20) : dialectPref

    try {
      const response = await register({
        displayName: displayName.trim(),
        email,
        password,
        learningGoal: combinedGoals,
        hskGoalLevel,
        dailyGoalMin: finalDailyMin,
        dialectPref: finalDialect,
        notifyTime: notifyTime ? `${notifyTime}:00` : null,
        darkMode
      })

      // Successful Registration: save credentials & token
      if (response.data.token) {
        localStorage.setItem('user_token', response.data.token)
        localStorage.setItem('user_profile', JSON.stringify(response.data.user))
        window.dispatchEvent(new Event('authChange'))
      }

      setSuccessMsg(response.data.message || 'Đăng ký tài khoản thành công!')
      
      // Clear inputs
      setDisplayName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        navigate('/')
      }, 1500)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký tài khoản!')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f3fcef] text-[#161d16] flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
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
              alt="Học tiếng Trung hiệu quả với TidaChinese" 
              className="w-full h-auto drop-shadow-2xl max-w-md mx-auto" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGYkZr0-SGEi-NLOBpieukwvevfXQoYeQm3JHCX8A2bwELb5jG13mH5fBv_N7AyBleC-yDq9NJkgkh0g5KCwpBm7hKVsc_GcIVbmoWYZHaj3iKp2uwaYhJkIBgSp-cPulidprggN-GDQnKAYZn9JmN2XVuY-IfkkpJJtrKy7SdFh4gFRMOC_pX8xQIzu1dogvPts5hnHEhiohOjXz2QbXrdjWpF8fPOuadosQ4GfckSdWcXXL8K25JmpkVtNTucEoKESqCd4PNxyo"
            />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[#161d16]">Bắt đầu hành trình chinh phục tiếng Trung</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Tạo tài khoản và thiết lập lộ trình học tập cá nhân hóa để cải thiện phản xạ giao tiếp tối ưu.
            </p>
          </div>
        </div>

        {/* Right Side: Step Card */}
        <div className="flex justify-center w-full">
          <div className="bg-white/95 backdrop-blur-md shadow-2xl w-full max-w-[520px] p-8 md:p-10 rounded-2xl border border-gray-200">
            
            {/* Stepper Progress indicator */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-[#006e2f] uppercase tracking-wider">Tham gia TidaChinese</span>
                <span className="text-xs font-semibold text-gray-400">Cơ bản {step}/{totalSteps}</span>
              </div>
              <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#006e2f] transition-all duration-300 ease-out" 
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Step 1: Account Info Form */}
            {step === 1 && (
              <form className="space-y-5" onSubmit={handleNext}>
                <div className="text-center mb-2">
                  <h1 className="text-xl md:text-2xl font-extrabold text-[#161d16]">Tạo tài khoản học viên</h1>
                  <p className="text-gray-400 text-xs">Hãy điền thông tin đăng nhập ban đầu.</p>
                </div>

                {/* Name Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700" htmlFor="displayName">Tên hiển thị</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">person</span>
                    <input 
                      className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 focus:border-[#006e2f] focus:ring-0 outline-none transition-all text-sm" 
                      id="displayName" 
                      name="displayName" 
                      placeholder="Nguyễn Văn A" 
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700" htmlFor="email">Email</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">mail</span>
                    <input 
                      className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 focus:border-[#006e2f] focus:ring-0 outline-none transition-all text-sm" 
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
                  <label className="text-xs font-bold text-gray-700" htmlFor="password">Mật khẩu</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">lock</span>
                    <input 
                      className="w-full pl-11 pr-12 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 focus:border-[#006e2f] focus:ring-0 outline-none transition-all text-sm" 
                      id="password" 
                      name="password" 
                      placeholder="••••••••" 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#006e2f] transition-colors" type="button">
                      <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
                
                {/* Confirm Password Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700" htmlFor="confirm_password">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">lock_reset</span>
                    <input 
                      className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 focus:border-[#006e2f] focus:ring-0 outline-none transition-all text-sm" 
                      id="confirm_password" 
                      name="confirm_password" 
                      placeholder="••••••••" 
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Submit / Next Button */}
                <button 
                  className="w-full bg-[#006e2f] hover:bg-[#005321] text-white text-sm font-bold py-3.5 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 mt-2 cursor-pointer" 
                  type="submit"
                >
                  Tiếp tục khảo sát
                </button>
              </form>
            )}

            {/* Step 2: Learning Goal */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center">
                  <h1 className="text-lg md:text-xl font-bold text-[#161d16]">Mục tiêu học tập của bạn?</h1>
                  <p className="text-gray-400 text-xs">Hãy chọn một hoặc nhiều mục đích bạn hướng tới.</p>
                </div>

                <div className="space-y-2.5 pt-2 max-h-[300px] overflow-y-auto pr-1">
                  {[
                    { value: 'communication', label: 'Giao tiếp hàng ngày', icon: 'chat', desc: 'Nói tự tin, lưu loát với người bản xứ.' },
                    { value: 'work', label: 'Công việc & Thương mại', icon: 'business_center', desc: 'Thăng tiến, giao dịch đối tác quốc tế.' },
                    { value: 'travel', label: 'Du lịch & Khám phá', icon: 'explore', desc: 'Tự tin đi lại, đặt món ăn, mua sắm.' },
                    { value: 'hsk', label: 'Thi lấy chứng chỉ HSK', icon: 'school', desc: 'Luyện thi, săn học bổng, du học.' },
                    { value: 'other', label: 'Mục tiêu khác', icon: 'edit_note', desc: 'Nhập mục tiêu học tập cụ thể của riêng bạn.' }
                  ].map((item) => {
                    const isSelected = learningGoals.includes(item.value)
                    return (
                      <button
                        key={item.value}
                        onClick={() => toggleLearningGoal(item.value)}
                        className={`w-full p-3.5 rounded-xl border text-left flex gap-3 transition-all duration-200 outline-none ${
                          isSelected 
                            ? 'border-[#006e2f] bg-[#006e2f]/5 ring-1 ring-[#006e2f]' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        type="button"
                      >
                        <span className={`material-symbols-outlined text-2xl ${isSelected ? 'text-[#006e2f]' : 'text-gray-400'}`}>
                          {item.icon}
                        </span>
                        <div>
                          <h3 className="font-bold text-xs text-[#161d16]">{item.label}</h3>
                          <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {learningGoals.includes('other') && (
                  <div className="space-y-1.5 mt-2 animate-fadeIn">
                    <label className="text-[11px] font-bold text-gray-500" htmlFor="customGoalInput">Mục tiêu học khác</label>
                    <input
                      type="text"
                      id="customGoalInput"
                      placeholder="Ví dụ: Xem phim Trung Quốc không cần vietsub..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#006e2f] text-xs"
                      value={customGoal}
                      onChange={(e) => setCustomGoal(e.target.value)}
                      maxLength={40}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: HSK level Target */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="text-center">
                  <h1 className="text-lg md:text-xl font-bold text-[#161d16]">Mục tiêu cấp độ HSK?</h1>
                  <p className="text-gray-400 text-xs">Chọn mục tiêu để hệ thống chuẩn bị bộ từ vựng tối ưu.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {[1, 2, 3, 4, 5, 6].map((level) => (
                    <button
                      key={level}
                      onClick={() => setHskGoalLevel(level)}
                      className={`py-4 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 outline-none ${
                        hskGoalLevel === level 
                          ? 'border-[#006e2f] bg-[#006e2f]/5 ring-1 ring-[#006e2f]' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      type="button"
                    >
                      <span className={`text-base font-black ${hskGoalLevel === level ? 'text-[#006e2f]' : 'text-gray-700'}`}>HSK {level}</span>
                      <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">
                        {level <= 2 ? 'Cơ bản' : level <= 4 ? 'Trung cấp' : 'Cao cấp'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Daily Commitment Minutes */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="text-center">
                  <h1 className="text-lg md:text-xl font-bold text-[#161d16]">Thời gian học mỗi ngày?</h1>
                  <p className="text-gray-400 text-xs">Hãy thiết lập cột mốc học tập hàng ngày của bạn.</p>
                </div>

                <div className="space-y-2 pt-2">
                  {[
                    { value: 15, label: 'Khởi động nhẹ nhàng', mins: '15 phút' },
                    { value: 30, label: 'Tiêu chuẩn thường nhật', mins: '30 phút' },
                    { value: 45, label: 'Bứt phá giới hạn', mins: '45 phút' },
                    { value: 60, label: 'Đắm chìm hoàn toàn', mins: '60 phút' }
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => {
                        setDailyGoalMin(item.value)
                        setIsCustomDaily(false)
                      }}
                      className={`w-full px-4 py-3 rounded-lg border text-left flex justify-between items-center transition-all duration-200 outline-none ${
                        dailyGoalMin === item.value && !isCustomDaily
                          ? 'border-[#006e2f] bg-[#006e2f]/5 ring-1 ring-[#006e2f]' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      type="button"
                    >
                      <span className="text-xs font-bold text-gray-700">{item.label}</span>
                      <span className={`text-xs font-extrabold ${dailyGoalMin === item.value && !isCustomDaily ? 'text-[#006e2f]' : 'text-gray-400'}`}>
                        {item.mins}
                      </span>
                    </button>
                  ))}

                  {/* Custom Minutes Toggle */}
                  <button
                    onClick={() => setIsCustomDaily(true)}
                    className={`w-full px-4 py-3 rounded-lg border text-left flex justify-between items-center transition-all duration-200 outline-none ${
                      isCustomDaily 
                        ? 'border-[#006e2f] bg-[#006e2f]/5 ring-1 ring-[#006e2f]' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    type="button"
                  >
                    <span className="text-xs font-bold text-gray-700">Tùy chọn thời gian khác</span>
                    <span className={`text-xs font-extrabold ${isCustomDaily ? 'text-[#006e2f]' : 'text-gray-400'}`}>Khác</span>
                  </button>

                  {isCustomDaily && (
                    <div className="space-y-1 mt-2 animate-fadeIn">
                      <label className="text-[11px] font-bold text-gray-500" htmlFor="customDailyMinInput">Nhập số phút học</label>
                      <input
                        type="number"
                        id="customDailyMinInput"
                        placeholder="Số phút mỗi ngày (ví dụ: 25)"
                        min="1"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#006e2f] text-xs font-bold"
                        value={customDailyMin}
                        onChange={(e) => setCustomDailyMin(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Dialect, Notify, Settings */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="text-center">
                  <h1 className="text-lg md:text-xl font-bold text-[#161d16]">Thiết lập tùy biến cá nhân</h1>
                  <p className="text-gray-400 text-xs">Cấu hình cuối cùng để kích hoạt tài khoản của bạn.</p>
                </div>

                <div className="space-y-3.5 pt-2">
                  {/* Dialect */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Giọng địa phương học tập</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'beijing', label: 'Giọng Bắc Kinh' },
                        { value: 'standard', label: 'Phổ thông chuẩn' }
                      ].map((item) => (
                        <button
                          key={item.value}
                          onClick={() => {
                            setDialectPref(item.value)
                            setIsCustomDialect(false)
                          }}
                          className={`p-2 rounded-lg border text-center transition-all duration-200 outline-none text-xs font-bold ${
                            dialectPref === item.value && !isCustomDialect
                              ? 'border-[#006e2f] bg-[#006e2f]/5 ring-1 ring-[#006e2f]' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          type="button"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setIsCustomDialect(true)}
                      className={`w-full p-2 mt-1 rounded-lg border text-center text-xs font-bold transition-all duration-200 outline-none ${
                        isCustomDialect 
                          ? 'border-[#006e2f] bg-[#006e2f]/5 ring-1 ring-[#006e2f]' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      type="button"
                    >
                      Giọng địa phương khác
                    </button>

                    {isCustomDialect && (
                      <input
                        type="text"
                        placeholder="Nhập giọng nói (ví dụ: Giọng Quảng Đông)"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#006e2f] text-xs mt-1.5"
                        value={customDialect}
                        onChange={(e) => setCustomDialect(e.target.value)}
                        maxLength={18}
                      />
                    )}
                  </div>

                  {/* Notify Time */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 flex justify-between" htmlFor="notifyTime">
                      <span>Nhắc học hàng ngày</span>
                    </label>
                    <input
                      type="time"
                      id="notifyTime"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 outline-none focus:border-[#006e2f] text-xs font-bold text-gray-700"
                      value={notifyTime}
                      onChange={(e) => setNotifyTime(e.target.value)}
                    />
                  </div>

                  {/* Dark Mode toggle */}
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-700">Chế độ tối (Dark Mode)</span>
                    </div>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      type="button"
                      className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ease-in-out outline-none ${
                        darkMode ? 'bg-[#006e2f]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform duration-200 ease-in-out shadow-md ${
                          darkMode ? 'translate-x-5.5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Buttons for Onboarding Steps */}
            {step > 1 && (
              <div className="flex justify-between items-center mt-6 pt-5 border-t border-gray-100 gap-4">
                <button 
                  onClick={handlePrev}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold text-xs text-gray-600 transition-colors duration-150 cursor-pointer active:scale-95"
                  type="button"
                >
                  Quay lại
                </button>

                {step < totalSteps ? (
                  <button 
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-[#006e2f] hover:bg-[#005321] text-white font-bold rounded-lg text-xs transition-colors duration-150 cursor-pointer active:scale-95 shadow-sm"
                    type="button"
                  >
                    Tiếp tục
                  </button>
                ) : (
                  <button 
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-[#006e2f] hover:bg-[#005321] disabled:bg-gray-300 text-white font-bold rounded-lg text-xs transition-colors duration-150 cursor-pointer active:scale-95 shadow-sm flex items-center gap-2"
                    type="button"
                  >
                    {isLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                    Hoàn tất & Đăng ký
                  </button>
                )}
              </div>
            )}

            {/* Account Switcher Footer Link */}
            {step === 1 && (
              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <p className="text-gray-400 text-xs">
                  Đã có tài khoản? 
                  <a className="text-[#006e2f] font-bold hover:underline ml-1" href="/auth/login">Đăng nhập</a>
                </p>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Footer Copyright */}
      <footer className="mt-12 py-4 text-center w-full max-w-[1280px]">
        <p className="text-xs text-gray-400">
          © 2024 TidaChinese. Master Chinese with flow.
        </p>
      </footer>
    </div>
  )
}
