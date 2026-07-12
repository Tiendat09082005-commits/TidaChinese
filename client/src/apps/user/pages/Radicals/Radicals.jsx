import React, { useState, useEffect } from 'react'
import userApi from '../../services/userApi'
import RadicalPreview from '../../../../shared/components/RadicalPreview'
import Toast from '../../../../shared/components/Toast'

export default function Radicals() {
  const [search, setSearch] = useState('')
  const [activeStroke, setActiveStroke] = useState('all')
  const [radicals, setRadicals] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [playingAudioId, setPlayingAudioId] = useState(null)
  const [collapsedSections, setCollapsedSections] = useState({})

  const toggleSection = (id) => {
    setCollapsedSections(prev => ({
      ...prev,
      [id]: prev[id] === false ? true : false
    }))
  }

  const strokeFilters = [
    { id: 'all', label: 'Tất cả nét' },
    ...Array.from({ length: 17 }, (_, i) => ({
      id: String(i + 1),
      label: `${i + 1} nét`
    }))
  ]

  const fetchRadicals = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await userApi.get('/radicals', {
        params: {
          search,
          strokeCount: activeStroke
        }
      })
      if (res.data && res.data.success) {
        setRadicals(res.data.radicals)
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('Không thể kết nối đến máy chủ để tải danh sách bộ thủ!')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRadicals()
  }, [search, activeStroke])

  const handlePlayAudio = (url, id, speed = 1.0) => {
    if (!url || playingAudioId) return
    setPlayingAudioId(id)

    const audio = new Audio(url)
    audio.playbackRate = speed
    audio.onended = () => setPlayingAudioId(null)
    audio.onerror = () => {
      setPlayingAudioId(null)
      setErrorMsg('Không tìm thấy file phát âm của bộ thủ này!')
    }
    audio.play().catch(() => {
      setPlayingAudioId(null)
      setErrorMsg('Không tìm thấy file phát âm của bộ thủ này!')
    })
  }

  // Filter sections by stroke count (1 to 17)
  const strokeSections = Array.from({ length: 17 }, (_, i) => ({
    id: i + 1,
    label: `Bộ thủ ${i + 1} nét`
  }))

  // Filter visible sections based on active tab
  const getFilteredSections = () => {
    if (activeStroke === 'all') return strokeSections
    const strokeNum = parseInt(activeStroke)
    return strokeSections.filter(sec => sec.id === strokeNum)
  }

  const getRadicalsByStroke = (strokeId) => {
    return radicals.filter(r => r.stroke_count === strokeId)
  }

  return (
    <div className="w-full p-4 md:p-8 space-y-6 md:space-y-8 animate-fadeIn">
      {/* Title Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">Thư viện 214 Bộ thủ Hán tự</h1>
        <p className="text-gray-500 text-sm max-w-xl">
          Tra cứu các bộ thủ cơ bản trong chữ Hán giúp dễ dàng phân tích cấu trúc, học từ vựng và nhớ mặt chữ hiệu quả.
        </p>
      </div>

      {/* Search Input Container */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="relative w-full max-w-md group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#006e2f] transition-colors">search</span>
          <input
            type="text"
            className="w-full bg-[#f3fcef]/50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-[#006e2f] focus:bg-white outline-none transition-all"
            placeholder="Tìm kiếm bộ thủ bằng chữ Hán, Pinyin, nghĩa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stroke Filters Container */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">filter_list</span>
          Lọc theo số nét vẽ (1 - 17 nét)
        </h3>
        <div className="flex flex-wrap gap-2">
          {strokeFilters.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveStroke(item.id)}
              className={`h-9 px-5 rounded-full text-xs font-bold transition-all outline-none border flex items-center justify-center cursor-pointer ${
                activeStroke === item.id
                  ? 'bg-[#006e2f] text-white border-[#006e2f] shadow-sm shadow-[#006e2f]/20'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />}

      {/* Data Container with Divided Stroke Rows */}
      <div className="space-y-8">
        {loading ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-12 shadow-sm text-center text-slate-400 font-bold">
            <div className="w-8 h-8 border-4 border-[#006e2f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Đang tải dữ liệu bộ thủ...
          </div>
        ) : radicals.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-12 shadow-sm text-center text-slate-400 font-bold">
            Không tìm thấy bộ thủ nào phù hợp.
          </div>
        ) : (
          getFilteredSections().map((section) => {
            const sectionRadicals = getRadicalsByStroke(section.id)
            if (sectionRadicals.length === 0) return null

            const isCollapsed = collapsedSections[section.id] !== false

            return (
              <div key={section.id} className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
                {/* Section Header with toggle collapse handler */}
                <div 
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center justify-between pb-2 border-b border-gray-100 cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#006e2f] text-xl font-bold">format_list_bulleted</span>
                    <h2 className="text-sm font-black text-gray-800">{section.label}</h2>
                    <span className="text-[10px] text-gray-400 font-bold bg-gray-50 px-2 py-0.5 rounded border">
                      {sectionRadicals.length} bộ thủ
                    </span>
                  </div>
                  
                  {/* Caret Up/Down toggle icon */}
                  <span className="material-symbols-outlined text-gray-400 group-hover:text-[#006e2f] transition-all font-bold">
                    {isCollapsed ? 'expand_more' : 'expand_less'}
                  </span>
                </div>

                {/* Grid structure rendering actual cards (only visible if not collapsed) */}
                {!isCollapsed && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-4 justify-items-center animate-in fade-in slide-in-from-top-1 duration-200">
                    {sectionRadicals.map((item) => (
                      <div 
                        key={item.id} 
                        className="border border-slate-100 hover:border-[#006e2f]/30 bg-slate-50/50 hover:bg-white rounded-2xl p-3 flex flex-col items-center justify-between text-center transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group w-full max-w-[144px] mx-auto"
                      >
                        {/* Compact Hanzi Writer preview box */}
                        <div className="mb-3">
                          <RadicalPreview hanzi={item.hanzi} hideButtons={true} size={110} />
                        </div>

                        {/* Pinyin and Audio Icon */}
                        <div className="flex items-center gap-1.5 text-[13px] text-slate-400 font-medium mb-1">
                          <span className="font-bold text-slate-500">{item.pinyin}</span>
                          {item.audio_url && (
                            <div className="flex items-center gap-1">
                              <button
                                disabled={playingAudioId !== null}
                                onClick={() => handlePlayAudio(item.audio_url, item.id, 1.0)}
                                className={`p-1 rounded-full bg-slate-100 group-hover:bg-[#006e2f]/10 text-slate-400 group-hover:text-[#006e2f] transition-all cursor-pointer inline-flex items-center justify-center disabled:opacity-50 ${
                                  playingAudioId === item.id ? 'animate-pulse text-[#006e2f]' : ''
                                }`}
                                title="Nghe phát âm chuẩn (1.0x)"
                              >
                                <span className="material-symbols-outlined text-[15px]">volume_up</span>
                              </button>
                              <button
                                disabled={playingAudioId !== null}
                                onClick={() => handlePlayAudio(item.audio_url, item.id, 0.5)}
                                className="p-1 rounded-full bg-slate-100 hover:bg-amber-50 transition-all cursor-pointer inline-flex items-center justify-center disabled:opacity-50"
                                title="Nghe chậm (0.5x)"
                              >
                                <span className="material-symbols-outlined text-[15px] text-slate-400 hover:text-amber-600">slow_motion_video</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Bold name Hán Việt */}
                        <div className="text-base font-black text-slate-800 tracking-wide mt-1">
                          {item.name_vi}
                        </div>
                        
                        {/* Meaning description */}
                        <div className="text-xs text-slate-400 mt-1 line-clamp-1 leading-normal max-w-full">
                          {item.meaning}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
