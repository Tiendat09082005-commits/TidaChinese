import React, { useEffect, useRef } from 'react'

export default function QuickAccess() {
  const cardsRef = useRef([])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-card')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 })

    cardsRef.current.forEach(card => {
      if (card) observer.observe(card)
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  const actions = [
    {
      icon: 'add_circle',
      title: 'Thêm từ',
      desc: 'Tạo từ vựng cá nhân',
      iconBg: 'bg-blue-50 text-blue-500',
      borderHover: 'hover:border-blue-300 hover:shadow-blue-100/50',
      delay: '0.1s',
    },
    {
      icon: 'quiz',
      title: 'Luyện tập',
      desc: 'Flashcard & Games',
      iconBg: 'bg-purple-50 text-purple-500',
      borderHover: 'hover:border-purple-300 hover:shadow-purple-100/50',
      delay: '0.2s',
    },
    {
      icon: 'leaderboard',
      title: 'Xếp hạng',
      desc: 'Xem thành tích',
      iconBg: 'bg-emerald-50 text-emerald-500',
      borderHover: 'hover:border-emerald-300 hover:shadow-emerald-100/50',
      delay: '0.3s',
    },
    {
      icon: 'groups',
      title: 'Cộng đồng',
      desc: 'Nhóm FB hoặc Zalo',
      iconBg: 'bg-gray-100 text-gray-600',
      borderHover: 'hover:border-gray-400 hover:shadow-gray-100/50',
      delay: '0.4s',
    },
  ]

  return (
    <section>
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#161d16] flex items-center justify-center gap-1">
          Truy <span className="relative">cập<span className="absolute bottom-[-6px] left-0 w-full h-[4px] bg-[#22c55e] rounded-full"></span></span> nhanh
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {actions.map((act, idx) => (
          <div
            key={idx}
            ref={el => cardsRef.current[idx] = el}
            style={{ animationDelay: act.delay }}
            className={`opacity-0 bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 border border-gray-100/80 group cursor-pointer text-center ${act.borderHover}`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110 ${act.iconBg}`}>
              <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform duration-300">{act.icon}</span>
            </div>
            <h3 className="text-base font-bold text-[#161d16] mb-1">{act.title}</h3>
            <p className="text-gray-500 text-xs font-semibold">{act.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
