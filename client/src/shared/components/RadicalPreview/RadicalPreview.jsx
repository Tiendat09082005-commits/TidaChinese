import React, { useEffect, useRef, useState } from 'react'
import HanziWriter from 'hanzi-writer'
import { HANZI_WRITER_DEFAULTS } from '../../constants/hanziWriterDefaults'

export default function RadicalPreview({ hanzi, hideButtons = false, size }) {
  const containerRef = useRef(null)
  const writerRef = useRef(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isQuizActive, setIsQuizActive] = useState(false)

  const width = size || HANZI_WRITER_DEFAULTS.width
  const height = size || HANZI_WRITER_DEFAULTS.height

  useEffect(() => {
    let isCurrent = true
    setErrorMsg('')
    setIsQuizActive(false)
    
    // Clear DOM inside container immediately
    if (containerRef.current) {
      containerRef.current.innerHTML = ''
    }

    if (!hanzi || !hanzi.trim()) {
      writerRef.current = null
      return
    }

    setIsLoading(true)

    // Load character data first to check for invalid/rare chars
    HanziWriter.loadCharacterData(hanzi.trim())
      .then(() => {
        if (!isCurrent) return
        setIsLoading(false)
        if (!containerRef.current) return

        // Extra safety clearance right before creation
        containerRef.current.innerHTML = ''

        // Create writer instance with shared defaults
        writerRef.current = HanziWriter.create(
          containerRef.current,
          hanzi.trim(),
          {
            ...HANZI_WRITER_DEFAULTS,
            width,
            height
          }
        )
      })
      .catch(() => {
        if (!isCurrent) return
        setIsLoading(false)
        writerRef.current = null
        setErrorMsg('Lỗi nét viết')
      })

    // Cleanup: cancel playing animations on unmount and invalidate promise callback
    return () => {
      isCurrent = false
      if (writerRef.current && typeof writerRef.current.cancelAnimations === 'function') {
        writerRef.current.cancelAnimations()
      }
    }
  }, [hanzi, width, height])

  const handleAnimate = () => {
    if (writerRef.current) {
      setIsQuizActive(false)
      writerRef.current.animateCharacter()
    }
  }

  const handleQuiz = () => {
    if (writerRef.current) {
      setIsQuizActive(true)
      writerRef.current.quiz()
    }
  }

  const handleMouseEnter = () => {
    if (hideButtons && writerRef.current && typeof writerRef.current.animateCharacter === 'function') {
      writerRef.current.animateCharacter()
    }
  }

  if (hideButtons) {
    return (
      <div 
        onMouseEnter={handleMouseEnter}
        className="relative border border-red-200 bg-white rounded-lg overflow-hidden flex items-center justify-center cursor-pointer select-none"
        style={{ width: width + 4, height: height + 4 }}
      >
        {/* Tianzige crosshairs */}
        <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-red-200/80 -translate-y-1/2 z-0"></div>
        <div className="absolute left-1/2 top-0 h-full border-l border-dashed border-red-200/80 -translate-x-1/2 z-0"></div>
        
        {/* Hanzi Writer Mount Point */}
        <div ref={containerRef} className="relative z-10 flex items-center justify-center" style={{ width, height }}></div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center">
            <div className="w-4 h-4 border border-[#006e2f] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 w-full">
      <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest w-full pb-2 border-b border-slate-200 text-center">
        Xem trước Hán tự (Live Preview)
      </h3>

      {/* Grid container representing Tianzige (田字格) */}
      <div className="relative w-[184px] h-[184px] border-2 border-red-500 bg-white rounded-lg shadow-inner overflow-hidden flex items-center justify-center select-none">
        
        {/* Tianzige crosshairs */}
        <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-red-300/80 -translate-y-1/2 z-0"></div>
        <div className="absolute left-1/2 top-0 h-full border-l border-dashed border-red-300/80 -translate-x-1/2 z-0"></div>
        
        {/* Hanzi Writer Mount Point */}
        <div ref={containerRef} className="relative z-10 w-[180px] h-[180px] flex items-center justify-center"></div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#006e2f] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Interactive Controls */}
      <div className="w-full space-y-2">
        {errorMsg ? (
          <p className="text-[10px] text-red-500 font-extrabold text-center bg-red-50 p-2.5 rounded-lg border border-red-100 leading-normal">
            {errorMsg}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!writerRef.current}
              onClick={handleAnimate}
              className="py-2 px-3 bg-[#006e2f]/10 hover:bg-[#006e2f]/20 disabled:opacity-50 text-[#006e2f] border border-[#006e2f]/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
              Xem nét viết
            </button>
            <button
              type="button"
              disabled={!writerRef.current}
              onClick={handleQuiz}
              className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                isQuizActive
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              {isQuizActive ? 'Đang viết thử' : 'Viết thử'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
