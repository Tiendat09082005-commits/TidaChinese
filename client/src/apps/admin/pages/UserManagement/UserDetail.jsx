import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUserById } from '../../services/userService'

export default function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserById(id)
        if (res.data && res.data.success) {
          setUser(res.data.user)
        } else {
          setError('Không thể tải chi tiết người dùng này!')
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi kết nối đến máy chủ!')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [id])

  const formatDate = (isoString) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getRoleLabel = (roleId) => {
    switch (roleId) {
      case 4: return 'Tối cao (Superadmin)'
      case 3: return 'Quản trị (Admin)'
      case 2: return 'Giáo viên'
      default: return 'Học viên'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#006e2f] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-8 max-w-lg mx-auto mt-10 text-center shadow-sm">
        <span className="material-symbols-outlined text-red-500 text-5xl mb-3">error</span>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Đã có lỗi xảy ra!</h2>
        <p className="text-gray-600 mb-6">{error || 'Không tìm thấy thông tin người dùng!'}</p>
        <button 
          onClick={() => navigate('/admin/users')}
          className="bg-[#006e2f] hover:bg-[#005321] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer"
        >
          Quay lại danh sách
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Navigation Header */}
      <div className="mb-6 flex justify-between items-center">
        <nav className="flex items-center gap-2 text-gray-500 text-xs font-semibold">
          <span onClick={() => navigate('/admin')} className="hover:text-[#006e2f] transition-colors cursor-pointer">Admin</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span onClick={() => navigate('/admin/users')} className="hover:text-[#006e2f] transition-colors cursor-pointer">Quản lý người dùng</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#006e2f] font-bold">Chi tiết người dùng</span>
        </nav>
        <button 
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 bg-white rounded-lg text-sm font-bold transition-all cursor-pointer shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Quay lại
        </button>
      </div>

      {/* Main Details Card */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Banner header with user profile snippet */}
        <div className="bg-gradient-to-r from-[#006e2f]/10 to-[#edf6ea] p-8 border-b border-gray-200 flex items-center gap-6">
          <img 
            src={user.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeFPvIyOj8V_hPCH86aE6eW_YrVXqcJ1aYi3T7EJ4J3wvfAjHpKpEnCXiRUh_k99hTLRBNZ425qEEcchEO9h5YDhcRWzxiaFz7b4DNaXOVdRqH4JpQ8n4OGTinluL4sQSIV2KoqmuYKRy97Ch50fuikFBPdqEYPFRxHZCeNyxQ-4HQJpswKistMNWloIZH35EQjfox8r9qPXI6zuWJJmat2g5TqnrUQ7NDmpT8Ehx4VWaKgzYv7K2txNuCXDv2KSkCB02fQitqFG4'} 
            alt={user.display_name} 
            className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-800 mb-1">{user.display_name}</h1>
            <p className="text-sm font-semibold text-gray-500 flex items-center gap-1.5">
              <span>@{user.email.split('@')[0]}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
              <span className="px-2.5 py-0.5 bg-[#006e2f]/10 text-[#006e2f] rounded-lg text-xs font-bold border border-[#006e2f]/20">
                {getRoleLabel(user.role_id)}
              </span>
            </p>
          </div>
        </div>

        {/* Detailed Fields Grid */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
          <div>
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Địa chỉ Email</span>
            <span className="text-sm font-semibold text-gray-800 break-all">{user.email}</span>
          </div>

          <div>
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Chuỗi học streak liên tục</span>
            <span className="text-sm font-semibold text-gray-800">🔥 {user.streak_days || 0} ngày</span>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Trình độ HSK mục tiêu</span>
            <span className="text-sm font-semibold text-gray-800">HSK {user.hsk_goal_level || 'Chưa thiết lập'}</span>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Thời gian cam kết học tập</span>
            <span className="text-sm font-bold text-[#006e2f] text-base">
              {user.daily_goal_min || 15} phút/ngày
            </span>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Giọng nói địa phương</span>
            <span className="text-sm font-semibold text-gray-800 uppercase">{user.dialect_pref || 'Beijing'}</span>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Trạng thái hệ thống</span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
              <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-[#006e2f]' : 'bg-red-500'}`}></span>
              {user.is_active ? 'Đang hoạt động' : 'Tạm khóa'}
            </span>
          </div>

          <div className="border-t border-gray-100 pt-4 col-span-1 md:col-span-2">
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ngày tham gia hệ thống</span>
            <span className="text-sm font-semibold text-gray-800">{formatDate(user.created_at)}</span>
          </div>

          <div className="border-t border-gray-100 pt-4 col-span-1 md:col-span-2">
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Đăng nhập lần cuối</span>
            <span className="text-sm font-semibold text-gray-800">
              {user.last_login_at ? new Date(user.last_login_at).toLocaleString('vi-VN') : 'Học viên chưa từng đăng nhập'}
            </span>
          </div>
        </div>

        {/* Footer controls */}
        <div className="bg-gray-50 px-8 py-5 border-t border-gray-200 flex justify-end gap-3">
          <button 
            onClick={() => navigate('/admin/users')}
            className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold transition-all cursor-pointer"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    </div>
  )
}
