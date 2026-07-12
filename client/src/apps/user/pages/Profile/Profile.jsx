import React, { useState, useEffect } from 'react'
import { getProfile, updateProfile } from '../../services/profileService'
import Toast from '../../../../shared/components/Toast'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  
  // Form states
  const [displayName, setDisplayName] = useState('')
  const [learningGoals, setLearningGoals] = useState([])
  const [customGoal, setCustomGoal] = useState('')
  const [hskGoalLevel, setHskGoalLevel] = useState(3)
  const [dailyGoalMin, setDailyGoalMin] = useState(15)
  const [customDailyMin, setCustomDailyMin] = useState('')
  const [isCustomDaily, setIsCustomDaily] = useState(false)
  const [dialectPref, setDialectPref] = useState('beijing')
  const [customDialect, setCustomDialect] = useState('')
  const [isCustomDialect, setIsCustomDialect] = useState(false)
  const [notifyTime, setNotifyTime] = useState('20:00')
  const [fontSize, setFontSize] = useState(2)
  const [darkMode, setDarkMode] = useState(false)

  // Status feedback states
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  // Fetch profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getProfile()
        const data = response.data.profile
        setProfile(data)
        
        // Bind data to states
        setDisplayName(data.display_name || '')
        setHskGoalLevel(data.hsk_goal_level || 3)
        setNotifyTime(data.notify_time ? data.notify_time.slice(0, 5) : '20:00')
        setFontSize(data.font_size || 2)
        setDarkMode(data.dark_mode || false)

        // Parse learning goals
        if (data.learning_goal) {
          const goals = data.learning_goal.split(',')
          const standardKeys = ['communication', 'work', 'travel', 'hsk']
          const parsedGoals = []
          let customText = ''
          
          goals.forEach(g => {
            if (standardKeys.includes(g)) {
              parsedGoals.push(g)
            } else {
              parsedGoals.push('other')
              customText = g
            }
          })
          setLearningGoals(parsedGoals)
          setCustomGoal(customText)
        }

        // Parse daily minutes
        const standardMinutes = [15, 30, 45, 60]
        if (standardMinutes.includes(data.daily_goal_min)) {
          setDailyGoalMin(data.daily_goal_min)
          setIsCustomDaily(false)
        } else {
          setDailyGoalMin(data.daily_goal_min || 15)
          setCustomDailyMin(String(data.daily_goal_min || ''))
          setIsCustomDaily(true)
        }

        // Parse dialect pref
        const standardDialects = ['beijing', 'standard']
        if (standardDialects.includes(data.dialect_pref)) {
          setDialectPref(data.dialect_pref)
          setIsCustomDialect(false)
        } else {
          setDialectPref(data.dialect_pref || 'beijing')
          setCustomDialect(data.dialect_pref || '')
          setIsCustomDialect(true)
        }

      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Không thể tải thông tin tài khoản của bạn!')
      } finally {
        setIsFetching(false)
      }
    }

    loadProfile()
  }, [])

  const toggleLearningGoal = (val) => {
    if (learningGoals.includes(val)) {
      setLearningGoals(learningGoals.filter(item => item !== val))
    } else {
      setLearningGoals([...learningGoals, val])
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    if (!displayName.trim()) {
      setErrorMsg('Tên hiển thị không được để trống!')
      setIsLoading(false)
      return
    }

    if (learningGoals.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất một mục tiêu học tập!')
      setIsLoading(false)
      return
    }

    if (learningGoals.includes('other') && !customGoal.trim()) {
      setErrorMsg('Vui lòng nhập cụ thể mục tiêu khác!')
      setIsLoading(false)
      return
    }

    if (isCustomDaily && (!customDailyMin || parseInt(customDailyMin) <= 0)) {
      setErrorMsg('Vui lòng nhập số phút học mỗi ngày hợp lệ!')
      setIsLoading(false)
      return
    }

    if (isCustomDialect && !customDialect.trim()) {
      setErrorMsg('Vui lòng nhập giọng nói địa phương cụ thể!')
      setIsLoading(false)
      return
    }

    // Process inputs
    const finalGoalsList = learningGoals
      .map(g => g === 'other' ? customGoal.trim() : g)
      .filter(Boolean)
    const combinedGoals = finalGoalsList.join(',').slice(0, 50)

    const finalDailyMin = isCustomDaily ? parseInt(customDailyMin) : dailyGoalMin
    const finalDialect = isCustomDialect ? customDialect.trim().slice(0, 20) : dialectPref

    try {
      const response = await updateProfile({
        displayName: displayName.trim(),
        learningGoal: combinedGoals,
        hskGoalLevel,
        dailyGoalMin: finalDailyMin,
        dialectPref: finalDialect,
        fontSize,
        darkMode,
        notifyTime: notifyTime ? `${notifyTime}:00` : null
      })

      const updated = response.data.profile
      setProfile(updated)

      // Sync local storage profile
      const stored = localStorage.getItem('user_profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        const newProfile = { ...parsed, ...updated }
        localStorage.setItem('user_profile', JSON.stringify(newProfile))
      }

      // Notify Layout immediately
      window.dispatchEvent(new Event('authChange'))

      setSuccessMsg(response.data.message || 'Cập nhật cấu hình tài khoản thành công!')
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin!')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
  }

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500 gap-3">
        <div className="w-8 h-8 border-4 border-[#006e2f] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold">Đang tải hồ sơ học viên...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
      {errorMsg && <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />}
      {successMsg && <Toast message={successMsg} type="success" onClose={() => setSuccessMsg('')} />}

      {/* Hero card section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#006e2f]/5 rounded-full filter blur-xl"></div>
        
        <div className="relative">
          <img
            src={profile?.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuBeFPvIyOj8V_hPCH86aE6eW_YrVXqcJ1aYi3T7EJ4J3wvfAjHpKpEnCXiRUh_k99hTLRBNZ425qEEcchEO9h5YDhcRWzxiaFz7b4DNaXOVdRqH4JpQ8n4OGTinluL4sQSIV2KoqmuYKRy97Ch50fuikFBPdqEYPFRxHZCeNyxQ-4HQJpswKistMNWloIZH35EQjfox8r9qPXI6zuWJJmat2g5TqnrUQ7NDmpT8Ehx4VWaKgzYv7K2txNuCXDv2KSkCB02fQitqFG4"}
            alt="Avatar"
            className="w-24 h-24 rounded-full border-4 border-[#f0f9eb] object-cover shadow-md"
          />
          <div className="absolute bottom-0 right-0 bg-[#006e2f] text-white p-1.5 rounded-full shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform flex items-center justify-center">
            <span className="material-symbols-outlined text-sm font-bold">photo_camera</span>
          </div>
        </div>

        <div className="text-center md:text-left space-y-1.5 flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h1 className="text-2xl font-black text-gray-800">{displayName}</h1>
            <span className="inline-block px-3 py-0.5 rounded-full bg-[#e8f5e9] text-[#006e2f] text-[10px] font-bold tracking-wider uppercase border border-[#a5d6a7]/35 w-fit mx-auto md:mx-0">
              {profile?.role}
            </span>
          </div>
          <p className="text-gray-400 text-sm font-semibold">{profile?.email}</p>
          <div className="text-[11px] text-gray-400 font-bold flex flex-wrap justify-center md:justify-start gap-4 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              Tham gia: {formatDate(profile?.created_at)}
            </span>
            <span className="flex items-center gap-1.5 text-orange-600">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              Chuỗi học: {profile?.streak_days || 0} ngày
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Learning Configuration Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <span className="material-symbols-outlined text-[#006e2f] text-2xl font-bold">school</span>
            <h2 className="text-base font-black text-gray-800">Mục tiêu học tập</h2>
          </div>

          {/* Display Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700" htmlFor="profName">Tên hiển thị</label>
            <input
              type="text"
              id="profName"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#006e2f] focus:ring-0 outline-none text-sm bg-gray-50/50"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>

          {/* HSK Level Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Mục tiêu cấp độ HSK</label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setHskGoalLevel(level)}
                  className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                    hskGoalLevel === level
                      ? 'border-[#006e2f] bg-[#e8f5e9] text-[#006e2f] font-black'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  HSK {level}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Commitment minutes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Thời gian học mỗi ngày</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 15, label: '15 phút' },
                { value: 30, label: '30 phút' },
                { value: 45, label: '45 phút' },
                { value: 60, label: '60 phút' }
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setDailyGoalMin(item.value)
                    setIsCustomDaily(false)
                  }}
                  className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                    dailyGoalMin === item.value && !isCustomDaily
                      ? 'border-[#006e2f] bg-[#e8f5e9] text-[#006e2f]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsCustomDaily(true)}
              className={`w-full py-2 mt-1.5 rounded-lg border text-xs font-bold transition-all ${
                isCustomDaily
                  ? 'border-[#006e2f] bg-[#e8f5e9] text-[#006e2f]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              Tự chọn thời gian học khác
            </button>

            {isCustomDaily && (
              <input
                type="number"
                min="1"
                placeholder="Nhập số phút học mỗi ngày"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#006e2f] text-xs font-bold mt-1.5"
                value={customDailyMin}
                onChange={(e) => setCustomDailyMin(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Preferences & App Settings Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <span className="material-symbols-outlined text-[#006e2f] text-2xl font-bold">settings_accessibility</span>
            <h2 className="text-base font-black text-gray-800">Cấu hình sở thích</h2>
          </div>

          {/* Dialect Pref */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Giọng địa phương ưu tiên</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'beijing', label: 'Bắc Kinh' },
                { value: 'standard', label: 'Phổ thông' }
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setDialectPref(item.value)
                    setIsCustomDialect(false)
                  }}
                  className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                    dialectPref === item.value && !isCustomDialect
                      ? 'border-[#006e2f] bg-[#e8f5e9] text-[#006e2f]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            
            <button
              type="button"
              onClick={() => setIsCustomDialect(true)}
              className={`w-full py-2 mt-1.5 rounded-lg border text-xs font-bold transition-all ${
                isCustomDialect
                  ? 'border-[#006e2f] bg-[#e8f5e9] text-[#006e2f]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              Giọng nói địa phương khác
            </button>

            {isCustomDialect && (
              <input
                type="text"
                placeholder="Nhập giọng nói địa phương cụ thể"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#006e2f] text-xs mt-1.5"
                value={customDialect}
                onChange={(e) => setCustomDialect(e.target.value)}
                maxLength={20}
              />
            )}
          </div>

          {/* Daily reminder alert time */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700" htmlFor="profNotify">Giờ nhắc nhở học hàng ngày</label>
            <input
              type="time"
              id="profNotify"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#006e2f] text-xs font-bold text-gray-700 bg-gray-50/50"
              value={notifyTime}
              onChange={(e) => setNotifyTime(e.target.value)}
            />
          </div>

          {/* FontSize scale setting */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Cỡ chữ hiển thị</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 1, label: 'Nhỏ' },
                { val: 2, label: 'Vừa' },
                { val: 3, label: 'Lớn' }
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setFontSize(item.val)}
                  className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                    fontSize === item.val
                      ? 'border-[#006e2f] bg-[#e8f5e9] text-[#006e2f]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dark Mode toggle */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-xs font-bold text-gray-700">Chế độ tối (Dark Mode)</span>
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out outline-none ${
                darkMode ? 'bg-[#006e2f]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out shadow-md ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Multi-select goals tags */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <span className="material-symbols-outlined text-[#006e2f] text-2xl font-bold">military_tech</span>
            <h2 className="text-base font-black text-gray-800">Các mục tiêu học tập (Hỗ trợ chọn nhiều)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { value: 'communication', label: 'Giao tiếp hàng ngày', icon: 'chat' },
              { value: 'work', label: 'Công việc & Thương mại', icon: 'business_center' },
              { value: 'travel', label: 'Du lịch & Khám phá', icon: 'explore' },
              { value: 'hsk', label: 'Thi lấy chứng chỉ HSK', icon: 'school' },
              { value: 'other', label: 'Khác', icon: 'edit_note' }
            ].map((item) => {
              const isSelected = learningGoals.includes(item.value)
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => toggleLearningGoal(item.value)}
                  className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all duration-150 ${
                    isSelected
                      ? 'border-[#006e2f] bg-[#e8f5e9] text-[#006e2f]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`material-symbols-outlined text-lg ${isSelected ? 'text-[#006e2f]' : 'text-gray-400'}`}>{item.icon}</span>
                  <span className="text-xs font-bold text-gray-700">{item.label}</span>
                </button>
              )
            })}
          </div>

          {learningGoals.includes('other') && (
            <div className="space-y-1.5 pt-2 animate-fadeIn">
              <label className="text-[11px] font-bold text-gray-500" htmlFor="customGoal">Nhập mục tiêu học khác của bạn</label>
              <input
                type="text"
                id="customGoal"
                placeholder="Ví dụ: Luyện nói trôi chảy để nói chuyện với thần tượng..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#006e2f] text-xs font-semibold"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                maxLength={40}
              />
            </div>
          )}
        </div>

        {/* Submit Form Action Bar */}
        <div className="md:col-span-2 flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3.5 bg-[#006e2f] hover:bg-[#005321] disabled:bg-gray-300 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
          >
            {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            Lưu thay đổi cấu hình
          </button>
        </div>

      </form>
    </div>
  )
}
