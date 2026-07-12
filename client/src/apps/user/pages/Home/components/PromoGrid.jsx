import React from 'react'

export default function PromoGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto">
      {/* Major Ad Box */}
      <div className="md:col-span-2 relative overflow-hidden rounded-2xl bg-[#006e2f] text-white p-10 min-h-[280px] flex flex-col justify-end group cursor-pointer shadow-md hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)] opacity-50"></div>
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-black mb-4 group-hover:translate-x-2 transition-transform duration-300">
            Nâng tầm kiến thức <br/>mỗi ngày
          </h2>
          <p className="text-white/80 text-sm md:text-base max-w-md mb-6">
            Tham gia các khoá học chuyên sâu cùng đội ngũ giáo viên bản xứ giàu kinh nghiệm.
          </p>
          <button className="px-8 py-3 bg-white text-[#006e2f] rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-102 transition-all active:scale-95">
            Tham gia ngay
          </button>
        </div>
      </div>

      {/* Leaderboard Card */}
      <div className="bg-[#2170e4] text-white p-8 rounded-2xl flex flex-col justify-between group cursor-pointer overflow-hidden relative shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
        <span className="material-symbols-outlined text-5xl mb-6 group-hover:rotate-12 transition-transform">stars</span>
        <div>
          <h3 className="text-2xl font-black mb-1">Bảng xếp hạng</h3>
          <p className="text-white/80 text-sm">Thi đua cùng hàng nghìn học viên khác trên toàn thế giới.</p>
        </div>
      </div>
    </div>
  )
}
