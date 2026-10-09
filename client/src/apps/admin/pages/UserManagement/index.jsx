import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  bulkUpdateUsers,
  bulkDeleteUsers
} from '../../services/userService'
import Toast from '../../../../shared/components/Toast'

export default function UserManagement() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({ total: 0, students: 0, teachers: 0, active: 0 })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [roleType, setRoleType] = useState('USER') // 'USER' (roles 1,2) or 'ADMIN' (roles 3,4)
  const [exactRole, setExactRole] = useState('ALL')
  const [isActive, setIsActive] = useState('ALL')
  
  // Selection & Bulk actions
  const [selectedUsers, setSelectedUsers] = useState([])
  
  // Kebab menu state
  const [openMenuId, setOpenMenuId] = useState(null)
  
  // Loading & Alerts
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Modals Active States
  const [activeModal, setActiveModal] = useState(null) // 'add' | 'edit' | 'delete'
  const [selectedUser, setSelectedUser] = useState(null)

  // Form Fields State (Aligned with updated backend schema)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    roleId: 1, // 1: User, 2: Teacher, 3: Admin, 4: Superadmin
    isActive: true,
    hskGoalLevel: 3
  })

  // Close kebab menu when clicking outside
  const menuRef = useRef()
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch Users Function
  const fetchUsers = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const response = await getUsers({
        page,
        limit,
        search,
        roleType,
        exactRole,
        isActive
      })
      if (response.data && response.data.success) {
        setUsers(response.data.users)
        setTotal(response.data.total)
        if (response.data.stats) {
          setStats(response.data.stats)
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu người dùng!')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // Reset selection when changing page/filters
    setSelectedUsers([])
    setOpenMenuId(null)
  }, [page, limit, roleType, exactRole, isActive])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const handleClearFilters = () => {
    setExactRole('ALL')
    setIsActive('ALL')
    setPage(1)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Cast numeric and boolean values correctly
    let finalValue = value
    if (name === 'roleId' || name === 'hskGoalLevel') {
      finalValue = parseInt(value)
    } else if (name === 'isActive') {
      finalValue = value === 'true'
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }))
  }

  const openAddModal = () => {
    setFormData({
      email: '',
      password: '',
      displayName: '',
      roleId: roleType === 'ADMIN' ? 3 : 1,
      isActive: true,
      hskGoalLevel: 3
    })
    setErrorMsg('')
    setActiveModal('add')
  }

  const openEditModal = (user) => {
    setErrorMsg('')
    setSelectedUser(user)
    setFormData({
      displayName: user.display_name,
      roleId: user.role_id,
      isActive: user.is_active,
      hskGoalLevel: user.hsk_goal_level || 3
    })
    setActiveModal('edit')
    setOpenMenuId(null)
  }

  const openDeleteModal = (user) => {
    setSelectedUser(user)
    setErrorMsg('')
    setActiveModal('delete')
    setOpenMenuId(null)
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!formData.displayName.trim() || !formData.email.trim() || !formData.password.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ các trường dữ liệu đánh dấu *!')
      return
    }

    try {
      const res = await createUser(formData)
      if (res.data && res.data.success) {
        setSuccessMsg(res.data.message)
        setActiveModal(null)
        fetchUsers()
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi thêm tài khoản!')
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!formData.displayName.trim()) {
      setErrorMsg('Tên hiển thị không được để trống!')
      return
    }

    try {
      const res = await updateUser(selectedUser.id, formData)
      if (res.data && res.data.success) {
        setSuccessMsg(res.data.message)
        setActiveModal(null)
        fetchUsers()
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật!')
    }
  }

  const handleDeleteConfirm = async (mode) => {
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await deleteUser(selectedUser.id, { mode }) // mode = 'soft' | 'hard'
      if (res.data && res.data.success) {
        setSuccessMsg(res.data.message)
        setActiveModal(null)
        if (users.length === 1 && page > 1) {
          setPage(prev => prev - 1)
        } else {
          fetchUsers()
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi xử lý xóa người dùng!')
    }
  }

  // Bulk Actions
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(users.map(u => u.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectUser = (id) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(uId => uId !== id) : [...prev, id]
    )
  }

  const handleBulkUpdateStatus = async (isActiveStatus) => {
    if (!confirm('Bạn có chắc chắn muốn thay đổi trạng thái của các tài khoản đã chọn?')) return
    try {
      const res = await bulkUpdateUsers({ userIds: selectedUsers, updateData: { isActive: isActiveStatus } })
      if (res.data && res.data.success) {
        setSuccessMsg(res.data.message)
        setSelectedUsers([])
        fetchUsers()
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái hàng loạt!')
    }
  }

  const handleBulkUpdateRole = async (newRoleId) => {
    if (!confirm('Bạn có chắc chắn muốn thay đổi vai trò của các tài khoản đã chọn?')) return
    try {
      const res = await bulkUpdateUsers({ userIds: selectedUsers, updateData: { roleId: newRoleId } })
      if (res.data && res.data.success) {
        setSuccessMsg(res.data.message)
        setSelectedUsers([])
        fetchUsers()
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi cập nhật vai trò hàng loạt!')
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa (vĩnh viễn) các tài khoản đã chọn? Hành động này không thể hoàn tác!')) return
    try {
      const res = await bulkDeleteUsers({ userIds: selectedUsers, mode: 'hard' })
      if (res.data && res.data.success) {
        setSuccessMsg(res.data.message)
        setSelectedUsers([])
        fetchUsers()
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi xóa tài khoản hàng loạt!')
    }
  }

  const formatDate = (isoString) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getRoleBadgeStyle = (roleId) => {
    switch (roleId) {
      case 4: // Superadmin
        return 'bg-purple-50 text-purple-700 border-purple-100'
      case 3: // Admin
        return 'bg-rose-50 text-rose-700 border-rose-100'
      case 2: // Teacher
        return 'bg-indigo-50 text-indigo-700 border-indigo-100'
      default: // User
        return 'bg-[#006e2f]/10 text-[#006e2f] border-[#006e2f]/20'
    }
  }

  const getRoleLabel = (roleId) => {
    switch (roleId) {
      case 4: return 'Tối cao (Super)'
      case 3: return 'Quản trị (Admin)'
      case 2: return 'Giáo viên'
      default: return 'Học viên'
    }
  }

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="min-h-full pb-10">
      {/* Breadcrumbs & Header */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-gray-500 mb-3 text-xs font-semibold">
          <span className="hover:text-[#006e2f] transition-colors cursor-pointer">Admin</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#006e2f] font-bold">Quản lý người dùng</span>
        </nav>
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h1 className="text-xl font-bold text-[#111827]">Quản lý người dùng</h1>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={openAddModal}
              className="bg-[#006e2f] hover:bg-[#005321] text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              Thêm người dùng
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats - 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#006e2f]/10 text-[#006e2f] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">group</span>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-800">{stats.total}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tổng người dùng</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">school</span>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-800">{stats.students}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Học viên</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">history_edu</span>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-800">{stats.teachers}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Giáo viên</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">task_alt</span>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-800">{stats.active}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Đang hoạt động</div>
          </div>
        </div>
      </div>

      {/* Reusable Stateful Toast Feedbacks */}
      {successMsg && <Toast message={successMsg} type="success" onClose={() => setSuccessMsg('')} />}
      {errorMsg && activeModal === null && <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />}

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-2xl px-6 shadow-sm border-t border-x overflow-x-auto whitespace-nowrap">
        <button 
          onClick={() => { setRoleType('USER'); setPage(1); setExactRole('ALL'); setIsActive('ALL'); }}
          className={`px-6 py-4 border-b-2 font-bold text-sm transition-all ` + (
            roleType === 'USER' 
              ? 'border-[#006e2f] text-[#006e2f]' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Học viên & Giáo viên
        </button>
        <button 
          onClick={() => { setRoleType('ADMIN'); setPage(1); setExactRole('ALL'); setIsActive('ALL'); }}
          className={`px-6 py-4 border-b-2 font-bold text-sm transition-all ` + (
            roleType === 'ADMIN' 
              ? 'border-[#006e2f] text-[#006e2f]' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Quản trị viên
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-auto">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text" 
            placeholder="Tìm kiếm theo tên, email..." 
            className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#006e2f] focus:ring-1 focus:ring-[#006e2f] w-full md:w-72 transition-all"
          />
        </form>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select 
            value={exactRole} 
            onChange={(e) => { setExactRole(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:border-[#006e2f] transition-all flex-1 md:flex-none"
          >
            <option value="ALL">Vai trò: Tất cả</option>
            {roleType === 'USER' ? (
              <>
                <option value="1">Học viên</option>
                <option value="2">Giáo viên</option>
              </>
            ) : (
              <>
                <option value="3">Quản trị (Admin)</option>
                <option value="4">Tối cao (Superadmin)</option>
              </>
            )}
          </select>

          <select 
            value={isActive} 
            onChange={(e) => { setIsActive(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:border-[#006e2f] transition-all flex-1 md:flex-none"
          >
            <option value="ALL">Trạng thái: Tất cả</option>
            <option value="true">Hoạt động</option>
            <option value="false">Đã khóa</option>
          </select>

          {(exactRole !== 'ALL' || isActive !== 'ALL' || search !== '') && (
            <button 
              onClick={handleClearFilters}
              className="text-[#006e2f] hover:text-[#005321] text-sm font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors px-2 py-2 w-full md:w-auto"
            >
              <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Floating Action Bar (Bulk Actions) */}
      {selectedUsers.length > 0 && (
        <div className="sticky top-4 z-40 mb-4 mx-auto max-w-max bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-300 border border-slate-700">
          <div className="flex items-center gap-2 border-r border-slate-700 pr-4">
            <span className="material-symbols-outlined text-[#00e676]">check_circle</span>
            <span className="font-bold text-sm">Đã chọn {selectedUsers.length}</span>
          </div>
          <div className="flex items-center gap-2">
            {roleType === 'USER' && (
              <button 
                onClick={() => handleBulkUpdateRole(2)}
                className="px-3 py-1.5 hover:bg-white/10 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">switch_access_shortcut</span> Đổi thành GV
              </button>
            )}
            <button 
              onClick={() => handleBulkUpdateStatus(false)}
              className="px-3 py-1.5 hover:bg-white/10 rounded-lg text-xs font-semibold transition-colors text-amber-400 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">lock</span> Khóa
            </button>
            <button 
              onClick={() => handleBulkUpdateStatus(true)}
              className="px-3 py-1.5 hover:bg-white/10 rounded-lg text-xs font-semibold transition-colors text-emerald-400 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">lock_open</span> Mở khóa
            </button>
            <button 
              onClick={handleBulkDelete}
              className="px-3 py-1.5 hover:bg-red-500/20 rounded-lg text-xs font-semibold transition-colors text-red-400 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span> Xóa
            </button>
          </div>
        </div>
      )}

      {/* Premium Data Table Container */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] font-sans transition-all duration-300 relative">
        {loading ? (
          <div className="p-20 text-center text-slate-400 font-medium">Đang tải dữ liệu người dùng...</div>
        ) : users.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-gray-300">person_off</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Chưa có người dùng nào</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">Thử thay đổi bộ lọc tìm kiếm hoặc thêm mới người dùng vào hệ thống.</p>
            <button 
              onClick={openAddModal}
              className="bg-[#006e2f] hover:bg-[#005321] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer inline-flex gap-2 items-center"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span> Thêm người dùng
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto min-h-[300px]">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100">
                    <th className="px-6 py-4 w-12 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-[#006e2f] focus:ring-[#006e2f] cursor-pointer accent-[#006e2f]"
                        checked={users.length > 0 && selectedUsers.length === users.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-left">Người dùng</th>
                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-left">Email liên hệ</th>
                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-left">Vai trò</th>
                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-left">Ngày tham gia</th>
                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-left">Trạng thái</th>
                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                  {users.map((user) => (
                    <tr 
                      key={user.id} 
                      className={`transition-all duration-200 hover:bg-[#006e2f]/5 ${selectedUsers.includes(user.id) ? 'bg-[#006e2f]/5' : ''}`}
                    >
                      <td className="px-6 py-5 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300 text-[#006e2f] focus:ring-[#006e2f] cursor-pointer accent-[#006e2f]"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                        />
                      </td>
                      <td className="px-4 py-5 text-left">
                        <div className="flex items-center gap-3.5">
                          <div className="relative group">
                            <img 
                              src={user.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeFPvIyOj8V_hPCH86aE6eW_YrVXqcJ1aYi3T7EJ4J3wvfAjHpKpEnCXiRUh_k99hTLRBNZ425qEEcchEO9h5YDhcRWzxiaFz7b4DNaXOVdRqH4JpQ8n4OGTinluL4sQSIV2KoqmuYKRy97Ch50fuikFBPdqEYPFRxHZCeNyxQ-4HQJpswKistMNWloIZH35EQjfox8r9qPXI6zuWJJmat2g5TqnrUQ7NDmpT8Ehx4VWaKgzYv7K2txNuCXDv2KSkCB02fQitqFG4'} 
                              alt={user.display_name} 
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm transition-transform duration-200 group-hover:scale-105"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span 
                              className="text-sm font-semibold text-slate-800 hover:text-[#006e2f] transition-colors cursor-pointer"
                              onClick={() => navigate('detail/' + user.id)}
                            >
                              {user.display_name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium mt-0.5">ID: #{user.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500 font-medium text-left">{user.email}</td>
                      <td className="px-6 py-5 text-left">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${getRoleBadgeStyle(user.role_id)}`}>
                          {getRoleLabel(user.role_id)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-400 font-medium text-left">{formatDate(user.created_at)}</td>
                      <td className="px-6 py-5 text-left">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.is_active 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                          {user.is_active ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right relative">
                        <button 
                          onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all rounded-full cursor-pointer inline-flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                        
                        {/* Kebab Menu Dropdown */}
                        {openMenuId === user.id && (
                          <div 
                            ref={menuRef}
                            className="absolute right-8 top-10 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-30 py-2 animate-in fade-in zoom-in-95 duration-100"
                          >
                            <button 
                              onClick={() => navigate('detail/' + user.id)}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px] text-gray-400">visibility</span>
                              Xem chi tiết
                            </button>
                            <button 
                              onClick={() => openEditModal(user)}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px] text-amber-500">edit_square</span>
                              Chỉnh sửa
                            </button>
                            <button 
                              onClick={() => openDeleteModal(user)}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">lock</span>
                              Khóa/Xóa
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="block md:hidden divide-y divide-gray-100">
              {users.map((user) => (
                <div key={user.id} className={`p-4 relative transition-colors ${selectedUsers.includes(user.id) ? 'bg-[#006e2f]/5' : 'bg-white'}`}>
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all rounded-full cursor-pointer inline-flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                    {openMenuId === user.id && (
                      <div 
                        ref={menuRef}
                        className="absolute right-0 top-10 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-30 py-2"
                      >
                        <button onClick={() => navigate('detail/' + user.id)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors cursor-pointer">
                          <span className="material-symbols-outlined text-[18px] text-gray-400">visibility</span> Xem chi tiết
                        </button>
                        <button onClick={() => openEditModal(user)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors cursor-pointer">
                          <span className="material-symbols-outlined text-[18px] text-amber-500">edit_square</span> Chỉnh sửa
                        </button>
                        <button onClick={() => openDeleteModal(user)} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors cursor-pointer">
                          <span className="material-symbols-outlined text-[18px]">lock</span> Khóa/Xóa
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-[#006e2f] focus:ring-[#006e2f] cursor-pointer shrink-0 accent-[#006e2f]"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                    <div className="flex items-center gap-3 w-full">
                      <img 
                        src={user.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeFPvIyOj8V_hPCH86aE6eW_YrVXqcJ1aYi3T7EJ4J3wvfAjHpKpEnCXiRUh_k99hTLRBNZ425qEEcchEO9h5YDhcRWzxiaFz7b4DNaXOVdRqH4JpQ8n4OGTinluL4sQSIV2KoqmuYKRy97Ch50fuikFBPdqEYPFRxHZCeNyxQ-4HQJpswKistMNWloIZH35EQjfox8r9qPXI6zuWJJmat2g5TqnrUQ7NDmpT8Ehx4VWaKgzYv7K2txNuCXDv2KSkCB02fQitqFG4'} 
                        alt={user.display_name} 
                        className="w-12 h-12 rounded-full object-cover shadow-sm shrink-0"
                      />
                      <div className="flex flex-col">
                        <span className="text-base font-bold text-slate-800">{user.display_name}</span>
                        <span className="text-xs text-slate-500 mt-0.5 break-all">{user.email}</span>
                        <div className="flex gap-2 items-center mt-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${getRoleBadgeStyle(user.role_id)}`}>
                            {getRoleLabel(user.role_id)}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${user.is_active ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-rose-100 bg-rose-50 text-rose-600'}`}>
                            {user.is_active ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination Panel */}
        <div className="p-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-b-2xl">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">Hiển thị</span>
            <select 
              value={limit} 
              onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
              className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs font-bold text-gray-700 focus:outline-none focus:border-[#006e2f] transition-all cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-xs text-slate-500 font-medium">/ {total} tài khoản</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer inline-flex items-center justify-center bg-white"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="text-xs font-bold text-slate-700">Trang {page} / {totalPages}</span>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer inline-flex items-center justify-center bg-white"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {activeModal === 'add' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-base font-bold text-gray-800">Thêm người dùng mới</h2>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
                  {errorMsg}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên hiển thị *</label>
                  <input required name="displayName" value={formData.displayName} onChange={handleInputChange} type="text" placeholder="Nguyễn Văn A" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#006e2f] outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email *</label>
                  <input required name="email" value={formData.email} onChange={handleInputChange} type="email" placeholder="example@email.com" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#006e2f] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mật khẩu *</label>
                  <input required name="password" value={formData.password} onChange={handleInputChange} type="password" placeholder="••••••••" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#006e2f] outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vai trò hệ thống</label>
                  <select name="roleId" value={formData.roleId} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#006e2f] outline-none">
                    <option value={1}>Học viên (User)</option>
                    <option value={2}>Giáo viên (Teacher)</option>
                    <option value={3}>Quản trị (Admin)</option>
                    <option value={4}>Tối cao (Superadmin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trạng thái hoạt động</label>
                  <select name="isActive" value={String(formData.isActive)} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#006e2f] outline-none">
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Tạm khóa</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trình độ HSK</label>
                <select name="hskGoalLevel" value={formData.hskGoalLevel} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#006e2f] outline-none">
                  <option value={1}>HSK 1</option>
                  <option value={2}>HSK 2</option>
                  <option value={3}>HSK 3</option>
                  <option value={4}>HSK 4</option>
                  <option value={5}>HSK 5</option>
                  <option value={6}>HSK 6</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-semibold transition-all cursor-pointer">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-[#006e2f] hover:bg-[#005321] text-white rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer">
                  Thêm mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {activeModal === 'edit' && selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-base font-bold text-gray-800">Cập nhật tài khoản</h2>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
                  {errorMsg}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 uppercase">Tài khoản email (Không được sửa)</label>
                <p className="text-sm font-bold text-slate-600 bg-slate-100 p-2.5 rounded-lg border">{selectedUser.email}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên hiển thị *</label>
                <input required name="displayName" value={formData.displayName} onChange={handleInputChange} type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#006e2f] outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vai trò hệ thống</label>
                  <select name="roleId" value={formData.roleId} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#006e2f] outline-none">
                    <option value={1}>Học viên (User)</option>
                    <option value={2}>Giáo viên (Teacher)</option>
                    <option value={3}>Quản trị (Admin)</option>
                    <option value={4}>Tối cao (Superadmin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trạng thái hoạt động</label>
                  <select name="isActive" value={String(formData.isActive)} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#006e2f] outline-none">
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Tạm khóa</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trình độ HSK</label>
                <select name="hskGoalLevel" value={formData.hskGoalLevel} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#006e2f] outline-none">
                  <option value={1}>HSK 1</option>
                  <option value={2}>HSK 2</option>
                  <option value={3}>HSK 3</option>
                  <option value={4}>HSK 4</option>
                  <option value={5}>HSK 5</option>
                  <option value={6}>HSK 6</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-semibold transition-all cursor-pointer">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-[#006e2f] hover:bg-[#005321] text-white rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer">
                  Cập nhật thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {activeModal === 'delete' && selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-base font-bold text-gray-800">Xử lý tài khoản người dùng</h2>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
                  {errorMsg}
                </div>
              )}

              <p className="text-sm text-gray-600">
                Bạn đang thực hiện thao tác xóa/khóa tài khoản của: <strong className="text-gray-800">{selectedUser.display_name}</strong> ({selectedUser.email}).
                Vui lòng chọn phương thức xử lý dưới đây:
              </p>

              <div className="grid grid-cols-1 gap-2 pt-2">
                <button 
                  onClick={() => handleDeleteConfirm('soft')} 
                  className="w-full py-3 px-4 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-all text-left flex items-center gap-3 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">block</span>
                  <div>
                    <p className="font-extrabold">Khóa tài khoản (Khuyên dùng)</p>
                    <p className="font-medium text-[10px] text-amber-600 mt-0.5">Không cho phép đăng nhập, vẫn giữ lại lịch sử và dữ liệu học tập.</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleDeleteConfirm('hard')} 
                  className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-lg text-xs font-bold transition-all text-left flex items-center gap-3 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                  <div>
                    <p className="font-extrabold">Xóa vĩnh viễn khỏi CSDL</p>
                    <p className="font-medium text-[10px] text-red-600 mt-0.5">Xóa hoàn toàn mọi dữ liệu liên quan. Thao tác này không thể khôi phục!</p>
                  </div>
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-semibold transition-all cursor-pointer">
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
