import React from 'react'

export default function HskCarousel() {
  const levels = [
    { title: 'HSK 1', count: '150 bộ từ', difficulty: '1/5', progressWidth: 'w-[20%]' },
    { title: 'HSK 2', count: '300 bộ từ', difficulty: '2/5', progressWidth: 'w-[40%]' },
    { title: 'HSK 3', count: '600 bộ từ', difficulty: '3/5', progressWidth: 'w-[60%]' },
    { title: 'HSK 4', count: '1200 bộ từ', difficulty: '4/5', progressWidth: 'w-[80%]' },
    { title: 'HSK 5', count: '2500 bộ từ', difficulty: '5/5', progressWidth: 'w-[100%]' },
    { title: 'HSK 6', count: '5000+ bộ từ', difficulty: '5/5', progressWidth: 'w-[100%]' },
  ]

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-l-4 border-[#006e2f] pl-4">
        <div className="flex items-center gap-4">
          <h3 className="text-xl md:text-2xl font-black text-[#161d16]">HSK</h3>
          <span className="px-3 py-1 bg-[#22c55e]/15 text-[#006e2f] rounded-full text-xs font-bold uppercase">
            14 lộ trình
          </span>
        </div>
        <button className="text-[#006e2f] text-sm font-semibold flex items-center gap-1 hover:underline hover:translate-x-1 transition-transform">
          Xem tất cả <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

      {/* CAROUSEL */}
      <div className="relative group">
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x no-scrollbar">
          {levels.map((level, idx) => (
            <div
              key={idx}
              className="flex-none w-72 bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl border border-gray-100 snap-start transition-all duration-300 hover:-translate-y-1.5 cursor-pointer"
            >
              <div className="mb-4">
                <span className="text-xl font-bold text-[#006e2f]">{level.title}</span>
                <p className="text-gray-500 text-xs font-semibold mt-1">{level.count}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-gray-400">
                  <span>Độ khó</span>
                  <span>{level.difficulty}</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shimmer-overlay">
                  <div className={`h-full bg-[#006e2f] ${level.progressWidth} transition-all duration-1000 shadow-[inset_0_0_8px_rgba(255,255,255,0.4)]`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Carousel Nav Hint (Shadow edge) */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#f3fcef] to-transparent pointer-events-none"></div>
      </div>

      {/* Overall Group Progress */}
      <div className="mt-6 p-6 bg-white/60 rounded-2xl border border-gray-100 relative overflow-hidden group">
        <div className="flex justify-between items-center mb-2 relative z-10">
          <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006e2f] animate-pulse">analytics</span>
            Tiến độ chung HSK
          </span>
          <span className="text-sm font-extrabold text-[#006e2f]">15% Hoàn thành</span>
        </div>
        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden shimmer-overlay relative z-10">
          <div className="h-full bg-[#006e2f] shadow-[0_0_15px_rgba(0,110,47,0.3)] w-[15%] transition-all duration-1000 ease-out"></div>
        </div>
      </div>
    </section>
  )
}
