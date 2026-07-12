import React from 'react'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header Section with Breadcrumbs */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-gray-400 mb-4 text-xs font-semibold">
          <a className="hover:text-[#006e2f] transition-colors" href="#">Admin</a>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#006e2f] font-bold">Quản lý người dùng</span>
        </nav>
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#161d16]">Chào mừng Admin</h1>
            <p className="text-gray-500 text-sm mt-2 max-w-2xl">
              Đây là nơi bạn có thể quản lý danh sách học viên, giảng viên và điều phối các tài khoản trong hệ thống TidaChinese.
            </p>
          </div>
          {/* Stats Preview (Bento-lite) */}
          <div className="flex gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-150 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#006e2f]/10 flex items-center justify-center text-[#006e2f]">
                <span className="material-symbols-outlined">person</span>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold">Học viên mới</p>
                <p className="text-2xl font-black text-[#161d16]">1,284</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State Canvas & Right Widgets */}
      <div className="grid grid-cols-12 gap-6">
        {/* Large Content Card */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-gray-150 rounded-2xl h-[500px] flex flex-col items-center justify-center text-center p-8 shadow-sm relative overflow-hidden">
          {/* Atmospheric Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#006e2f 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          <div className="z-10 max-w-md">
            <div className="w-20 h-20 bg-[#006e2f]/5 rounded-full flex items-center justify-center mb-6 mx-auto">
              <span className="material-symbols-outlined text-[#006e2f] text-[40px]">group_add</span>
            </div>
            <h2 className="text-xl font-bold text-[#161d16] mb-2">Chưa có dữ liệu hiển thị</h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Bắt đầu bằng cách thêm người dùng mới hoặc nhập dữ liệu từ tệp CSV để quản lý cộng đồng học tập của bạn.
            </p>
            <button className="bg-[#006e2f] hover:bg-[#005321] text-white px-8 py-3 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 mx-auto">
              <span className="material-symbols-outlined">person_add</span>
              Thêm người dùng đầu tiên
            </button>
          </div>
        </div>

        {/* Secondary Sidebar Content (Widgets) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Quick Stats Card */}
          <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">Hoạt động gần đây</h3>
            <div className="space-y-4">
              {/* List Item */}
              <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex-shrink-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">history</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Nguyễn Văn A đã đăng ký</p>
                  <p className="text-[11px] text-gray-400 font-semibold mt-0.5">2 phút trước • Khóa học HSK 1</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-full bg-[#006e2f]/10 flex-shrink-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-[#006e2f]">update</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Cập nhật hệ thống thành công</p>
                  <p className="text-[11px] text-gray-400 font-semibold mt-0.5">1 giờ trước • Version 2.4.0</p>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 py-2 text-[#006e2f] hover:bg-[#006e2f]/5 text-sm font-bold rounded-lg transition-colors">
              Xem tất cả hoạt động
            </button>
          </div>

          {/* Progress Card */}
          <div className="bg-[#006e2f] text-white rounded-2xl p-6 shadow-lg relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-[120px]">trending_up</span>
            </div>
            <h3 className="text-xs font-semibold opacity-80 mb-1">Mục tiêu tăng trưởng</h3>
            <p className="text-2xl font-black mb-4">84% Hoàn thành</p>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mb-2">
              <div className="bg-white h-full rounded-full" style={{ width: '84%' }}></div>
            </div>
            <p className="text-[11px] opacity-80">Còn 1,200 người dùng nữa để đạt mục tiêu quý</p>
          </div>
        </div>
      </div>
    </div>
  )
}
