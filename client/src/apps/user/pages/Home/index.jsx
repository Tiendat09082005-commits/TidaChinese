import React from 'react'
import Hero from './components/Hero'
import QuickAccess from './components/QuickAccess'
import LearningTabs from './components/LearningTabs'
import HskCarousel from './components/HskCarousel'
import PromoGrid from './components/PromoGrid'

export default function Home() {
  return (
    <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-10 space-y-10">
      {/* Hero Header Banner */}
      <Hero />

      {/* Quick Actions Shortcuts */}
      <QuickAccess />

      {/* Learning Path Filters */}
      <LearningTabs />

      {/* HSK Carousel Course Groups */}
      <HskCarousel />

      {/* Promotional Bento Layout */}
      <PromoGrid />

      {/* Footer Branding */}
      <footer className="mt-10 p-6 bg-white/40 rounded-2xl text-center border-t border-gray-100">
        <p className="text-gray-500 text-sm font-semibold">
          © 2024 TidaChinese. Một sản phẩm của ngôn ngữ &amp; công nghệ.
        </p>
      </footer>
    </div>
  )
}
