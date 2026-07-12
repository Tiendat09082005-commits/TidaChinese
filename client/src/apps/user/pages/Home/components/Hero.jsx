import React from 'react'

export default function Hero() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-[#edf6ea]/60 rounded-3xl p-6 md:p-10 overflow-hidden relative border border-[#006e2f]/5 hover:border-[#006e2f]/10 hover:shadow-lg transition-all duration-300">
      <div className="space-y-6 relative z-10">
        <span className="inline-block px-3 py-1 bg-[#22c55e]/15 text-[#006e2f] rounded-full text-xs font-extrabold uppercase tracking-wide">
          CHÀO MỪNG BẠN TRỞ LẠI
        </span>
        <h2 className="text-4xl md:text-5xl font-black text-[#161d16] leading-[1.15] tracking-tight">
          Khám phá hành trình <br/>tiếng Trung của bạn
        </h2>
        <p className="text-gray-600 text-sm md:text-base max-w-lg leading-relaxed">
          Hệ thống học thông minh dựa trên phương pháp lặp lại ngắt quãng (SRS) giúp bạn ghi nhớ từ vựng vĩnh viễn và tiến bộ thần tốc qua từng bài học.
        </p>
        <div className="flex flex-wrap gap-4">
          <button className="px-10 py-3.5 bg-[#006e2f] text-white rounded-full font-bold shadow-md hover:bg-[#005321] hover:shadow-lg hover:scale-102 hover:-translate-y-[1px] active:translate-y-0 active:scale-100 transition-all duration-200">
            Bắt đầu học ngay
          </button>
          <button className="px-10 py-3.5 bg-white text-[#161d16] border border-gray-300 rounded-full font-bold hover:bg-gray-50 hover:scale-102 hover:-translate-y-[1px] active:translate-y-0 active:scale-100 transition-all duration-200">
            Tìm hiểu thêm
          </button>
        </div>
      </div>
      <div className="relative flex justify-center items-center group">
        <div className="absolute inset-0 bg-[#006e2f]/5 rounded-full blur-3xl group-hover:bg-[#006e2f]/10 transition-colors duration-500"></div>
        <img 
          alt="Khám phá hành trình tiếng Trung" 
          className="relative z-10 w-full max-w-md animate-float drop-shadow-xl group-hover:scale-102 transition-transform duration-500" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGYkZr0-SGEi-NLOBpieukwvevfXQoYeQm3JHCX8A2bwELb5jG13mH5fBv_N7AyBleC-yDq9NJkgkh0g5KCwpBm7hKVsc_GcIVbmoWYZHaj3iKp2uwaYhJkIBgSp-cPulidprggN-GDQnKAYZn9JmN2XVuY-IfkkpJJtrKy7SdFh4gFRMOC_pX8xQIzu1dogvPts5hnHEhiohOjXz2QbXrdjWpF8fPOuadosQ4GfckSdWcXXL8K25JmpkVtNTucEoKESqCd4PNxyo"
        />
      </div>
    </section>
  )
}
