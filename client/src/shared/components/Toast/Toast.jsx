import React, { useState, useEffect, useRef } from 'react'

export default function Toast({ message, type = 'success', duration = 3000, onClose }) {
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [progress, setProgress] = useState(100)
  const [isPaused, setIsPaused] = useState(false)
  
  const timeLeft = useRef(duration)
  const timerInterval = useRef(null)
  
  useEffect(() => {
    // If paused, do not count down
    if (isPaused) {
      if (timerInterval.current) clearInterval(timerInterval.current)
      return
    }

    const intervalStep = 50 // Update every 50ms
    timerInterval.current = setInterval(() => {
      timeLeft.current -= intervalStep
      
      // Calculate remaining progress percentage
      const percent = (timeLeft.current / duration) * 100
      setProgress(Math.max(0, percent))

      if (timeLeft.current <= 0) {
        clearInterval(timerInterval.current)
        triggerClose()
      }
    }, intervalStep)

    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current)
    }
  }, [isPaused, duration])

  const triggerClose = () => {
    setIsFadingOut(true)
    // Wait for the exit animation (300ms) to complete before unmounting
    setTimeout(() => {
      if (onClose) onClose()
    }, 300)
  }

  // Choose Toast colors based on Type
  const themeMap = {
    success: {
      border: 'border-green-200',
      bg: 'bg-green-50 text-green-800',
      progressBg: 'bg-green-600',
      icon: 'check_circle',
    },
    error: {
      border: 'border-red-200',
      bg: 'bg-red-50 text-red-800',
      progressBg: 'bg-red-600',
      icon: 'error',
    },
    warning: {
      border: 'border-amber-200',
      bg: 'bg-amber-50 text-amber-800',
      progressBg: 'bg-amber-600',
      icon: 'warning',
    },
    info: {
      border: 'border-blue-200',
      bg: 'bg-blue-50 text-blue-800',
      progressBg: 'bg-blue-600',
      icon: 'info',
    }
  }

  const currentTheme = themeMap[type] || themeMap.success

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`fixed top-6 right-6 z-50 flex flex-col w-full max-w-sm rounded-xl shadow-xl border overflow-hidden transition-all duration-300 ${
        currentTheme.border
      } ${currentTheme.bg} ${
        isFadingOut ? 'animate-toast-out' : 'animate-toast-in'
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        {/* Type Icon */}
        <span className="material-symbols-outlined text-2xl font-bold flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
          {currentTheme.icon}
        </span>
        
        {/* Message Content */}
        <div className="flex-1 text-sm font-semibold pr-2 leading-relaxed">
          {message}
        </div>

        {/* Close Button */}
        <button 
          onClick={triggerClose}
          className="text-gray-400 hover:text-gray-700 flex-shrink-0 flex items-center justify-center p-1 rounded-full hover:bg-black/5 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>

      {/* Progress Bar with running countdown visual */}
      <div className="w-full h-[3px] bg-black/5">
        <div 
          className={`h-full transition-all duration-75 ease-linear ${currentTheme.progressBg}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  )
}
