import React, { useState } from 'react'

export default function LearningTabs() {
  const tabs = [
    'Tất cả',
    'HSK',
    'Từ vựng theo chủ đề',
    'HSK 3.0',
    'Giáo trình Boya',
    'Giao tiếp',
  ]
  const [activeTab, setActiveTab] = useState('Tất cả')

  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-black uppercase tracking-widest text-[#006e2f]/70">LỘ TRÌNH HỌC</h2>
      </div>
      <div className="flex flex-wrap justify-center gap-2 md:gap-4 overflow-x-auto pb-2 no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab === activeTab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 hover:scale-105 active:scale-95 ${
                isActive 
                  ? 'bg-[#006e2f] text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-[#006e2f]/5 hover:text-[#006e2f]'
              }`}
            >
              {tab}
            </button>
          )
        })}
      </div>
    </section>
  )
}
