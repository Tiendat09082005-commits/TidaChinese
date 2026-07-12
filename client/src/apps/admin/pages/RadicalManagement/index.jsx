import React, { useState, useEffect } from 'react'
import { 
  getRadicals, 
  createRadical, 
  updateRadical, 
  deleteRadical, 
  checkDuplicateRadical, 
  getRadicalUsage, 
  uploadMedia 
} from '../../services/radicalService'
import Toast from '../../../../shared/components/Toast'
import RadicalPreview from '../../../../shared/components/RadicalPreview'

export default function RadicalManagement() {
  const [radicals, setRadicals] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')
  const [strokeCount, setStrokeCount] = useState('all')
  
  // Loading & Alerts
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Modals Active States
  const [activeModal, setActiveModal] = useState(null) // 'add' | 'edit' | 'delete'
  const [selectedRadical, setSelectedRadical] = useState(null)
  
  // Upload States
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [uploadingAnimation, setUploadingAnimation] = useState(false)

  // Radical Usage Details
  const [usageCount, setUsageCount] = useState(0)
  const [loadingUsage, setLoadingUsage] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  // Play audio handler with error boundary and double-play protection
  const handlePlayAudio = (url) => {
    if (!url || isPlayingAudio) return
    setIsPlayingAudio(true)
    
    const audio = new Audio(url)
    audio.onended = () => setIsPlayingAudio(false)
    audio.onerror = () => {
      setIsPlayingAudio(false)
      setErrorMsg('Không tìm thấy file âm thanh hoặc lỗi tải!')
    }
    
    audio.play().catch(() => {
      setIsPlayingAudio(false)
      setErrorMsg('Không tìm thấy file âm thanh hoặc lỗi tải!')
    })
  }

  // Form Fields State
  const [formData, setFormData] = useState({
    hanzi: '',
    variant_form: '',
    pinyin: '',
    name_vi: '',
    meaning: '',
    stroke_count: 1,
    position: 'left',
    story: '',
    audio_url: '',
    animation_url: '',
    stroke_video_url: '',
    is_simplified: true,
    sort_order: 0
  })

  // Duplicate warning states
  const [duplicateWarning, setDuplicateWarning] = useState('')

  // Fetch Radicals Function
  const fetchRadicals = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const response = await getRadicals({
        page,
        limit,
        search,
        strokeCount
      })
      if (response.data && response.data.success) {
        setRadicals(response.data.radicals)
        setTotal(response.data.total)
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách bộ thủ!')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRadicals()
  }, [page, strokeCount])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchRadicals()
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    let finalValue = value
    if (type === 'checkbox') {
      finalValue = checked
    } else if (name === 'stroke_count' || name === 'sort_order') {
      finalValue = value === '' ? '' : parseInt(value)
    } else if (name === 'is_simplified') {
      finalValue = value === 'true'
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }))
  }

  // Live duplicate check on hanzi field blur
  const handleHanziBlur = async () => {
    if (!formData.hanzi.trim() || activeModal === 'edit') return
    try {
      const res = await checkDuplicateRadical(formData.hanzi.trim())
      if (res.data && res.data.isDuplicate) {
        setDuplicateWarning(`Cảnh báo: Bộ thủ "${formData.hanzi}" đã tồn tại trong cơ sở dữ liệu!`)
      } else {
        setDuplicateWarning('')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Handle file uploads
  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    if (type === 'audio') {
      setUploadingAudio(true)
    } else {
      setUploadingAnimation(true)
    }

    try {
      const res = await uploadMedia(file, type)
      if (res.data && res.data.success) {
        setFormData(prev => ({
          ...prev,
          [type === 'audio' ? 'audio_url' : 'animation_url']: res.data.url
        }))
        setSuccessMsg(res.data.message)
      }
    } catch (err) {
      setErrorMsg('Lỗi upload file lên hệ thống!')
    } finally {
      setUploadingAudio(false)
      setUploadingAnimation(false)
    }
  }

  const openAddModal = () => {
    setFormData({
      hanzi: '',
      variant_form: '',
      pinyin: '',
      name_vi: '',
      meaning: '',
      stroke_count: 1,
      position: 'left',
      story: '',
      audio_url: '',
      animation_url: '',
      stroke_video_url: '',
      is_simplified: true,
      sort_order: 0
    })
    setDuplicateWarning('')
    setErrorMsg('')
    setActiveModal('add')
  }

  const openEditModal = (radical) => {
    setErrorMsg('')
    setDuplicateWarning('')
    setSelectedRadical(radical)
    setFormData({
      hanzi: radical.hanzi,
      variant_form: radical.variant_form || '',
      pinyin: radical.pinyin || '',
      name_vi: radical.name_vi || '',
      meaning: radical.meaning || '',
      stroke_count: radical.stroke_count || 1,
      position: radical.position || 'left',
      story: radical.story || '',
      audio_url: radical.audio_url || '',
      animation_url: radical.animation_url || '',
      stroke_video_url: radical.stroke_video_url || '',
      is_simplified: radical.is_simplified,
      sort_order: radical.sort_order || 0
    })
    setActiveModal('edit')
  }

  const openDeleteModal = async (radical) => {
    setSelectedRadical(radical)
    setErrorMsg('')
    setUsageCount(0)
    setLoadingUsage(true)
    setActiveModal('delete')

    try {
      const res = await getRadicalUsage(radical.id)
      if (res.data && res.data.success) {
        setUsageCount(res.data.usage.total)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingUsage(false)
    }
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!formData.hanzi.trim()) {
      setErrorMsg('Vui lòng điền chữ Hán bộ thủ!')
      return
    }

    if (formData.stroke_count < 1 || formData.stroke_count > 17) {
      setErrorMsg('Số nét vẽ phải nằm trong khoảng từ 1 đến 17!')
      return
    }

    try {
      const res = await createRadical(formData)
      if (res.data && res.data.success) {
        setSuccessMsg(res.data.message)
        setActiveModal(null)
        fetchRadicals()
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi tạo bộ thủ!')
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!formData.hanzi.trim()) {
      setErrorMsg('Vui lòng điền chữ Hán bộ thủ!')
      return
    }

    if (formData.stroke_count < 1 || formData.stroke_count > 17) {
      setErrorMsg('Số nét vẽ phải nằm trong khoảng từ 1 đến 17!')
      return
    }

    try {
      const res = await updateRadical(selectedRadical.id, formData)
      if (res.data && res.data.success) {
        setSuccessMsg(res.data.message)
        setActiveModal(null)
        fetchRadicals()
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật!')
    }
  }

  const handleDeleteConfirm = async () => {
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await deleteRadical(selectedRadical.id)
      if (res.data && res.data.success) {
        setSuccessMsg(res.data.message)
        setActiveModal(null)
        if (radicals.length === 1 && page > 1) {
          setPage(prev => prev - 1)
        } else {
          fetchRadicals()
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi xóa bộ thủ!')
    }
  }

  const getPositionLabel = (pos) => {
    switch (pos) {
      case 'left': return 'Bên trái (left)'
      case 'right': return 'Bên phải (right)'
      case 'top': return 'Ở trên (top)'
      case 'bottom': return 'Ở dưới (bottom)'
      case 'enclosure': return 'Bao quanh (enclosure)'
      case 'any': return 'Nằm bất kỳ (any)'
      default: return '-'
    }
  }

  return (
    <div className="min-h-full">
      {/* Breadcrumbs & Header */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-gray-500 mb-3 text-xs font-semibold">
          <span className="hover:text-[#006e2f] transition-colors cursor-pointer">Admin</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#006e2f] font-bold">Quản lý bộ thủ</span>
        </nav>
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h1 className="text-xl font-bold text-[#111827]">Quản lý bộ thủ</h1>
          
          <div className="flex flex-wrap items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text" 
                placeholder="Tìm kiếm bộ thủ, Hán tự..." 
                className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#006e2f] w-64 transition-all"
              />
            </form>
            <button 
              onClick={openAddModal}
              className="bg-[#006e2f] hover:bg-[#005321] text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              Thêm bộ thủ
            </button>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {successMsg && <Toast message={successMsg} type="success" onClose={() => setSuccessMsg('')} />}
      {errorMsg && activeModal === null && <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />}

      {/* Stroke Filter Tabs */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-2xl px-6 shadow-sm border-t border-x overflow-x-auto whitespace-nowrap">
        {['all', '1', '2', '3', '4', '5'].map((sc) => (
          <button 
            key={sc}
            onClick={() => { setStrokeCount(sc); setPage(1); }}
            className={`px-6 py-4 border-b-2 font-bold text-sm transition-all inline-block ${
              strokeCount === sc 
                ? 'border-[#006e2f] text-[#006e2f]' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {sc === 'all' ? 'Tất cả nét' : sc === '5' ? '5+ nét' : `${sc} nét`}
          </button>
        ))}
      </div>

      {/* Table Container */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] font-sans">
        {loading ? (
          <div className="p-20 text-center text-slate-400 font-medium">Đang tải dữ liệu bộ thủ...</div>
        ) : radicals.length === 0 ? (
          <div className="p-20 text-center text-slate-400 font-medium">Không tìm thấy bộ thủ nào phù hợp.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse table-auto">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="px-4 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">STT</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">Chữ</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">Biến thể</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">Hán Việt / Pinyin</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">Ý nghĩa</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">Số nét</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">Vị trí</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">Thể loại</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {radicals.map((item, idx) => (
                  <tr key={item.id} className="transition-all duration-200 hover:bg-[#006e2f]/5">
                    <td className="px-4 py-5 text-center text-sm font-semibold text-slate-400">
                      {(page - 1) * limit + idx + 1}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-2xl font-black text-slate-800 font-serif">{item.hanzi}</span>
                    </td>
                    <td className="px-6 py-5 text-center text-sm font-bold text-slate-500 font-serif">
                      {item.variant_form && item.variant_form.trim() ? item.variant_form.trim() : 'Không có'}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-semibold text-slate-800">{item.name_vi}</span>
                        <span className="text-[11px] text-slate-400 font-medium">{item.pinyin}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-500 font-medium text-center">{item.meaning}</td>
                    <td className="px-6 py-5 text-sm text-slate-500 font-bold text-center">{item.stroke_count} nét</td>
                    <td className="px-6 py-5 text-xs text-slate-500 font-semibold text-center">
                      {getPositionLabel(item.position)}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                        item.is_simplified 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {item.is_simplified ? 'Giản thể' : 'Phồn thể'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center space-x-1">
                      <button 
                        onClick={() => openEditModal(item)}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all rounded-full cursor-pointer inline-flex items-center justify-center" 
                        title="Chỉnh sửa"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit_square</span>
                      </button>
                      <button 
                        onClick={() => openDeleteModal(item)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-full cursor-pointer inline-flex items-center justify-center" 
                        title="Xóa bộ thủ"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-5 border-t border-slate-100 flex justify-between items-center bg-white">
          <p className="text-xs text-slate-400 font-semibold">
            Hiển thị {radicals.length > 0 ? (page - 1) * limit + 1 : 0}-{Math.min(page * limit, total)} trong số {total} bộ thủ
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer inline-flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={page * limit >= total}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer inline-flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Radical Modal */}
      {(activeModal === 'add' || activeModal === 'edit') && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-base font-bold text-gray-800">
                {activeModal === 'add' ? 'Thêm bộ thủ mới' : 'Cập nhật bộ thủ'}
              </h2>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={activeModal === 'add' ? handleAddSubmit : handleEditSubmit} className="p-6 space-y-6">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form Inputs (2/3 columns) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chữ Hán bộ thủ *</label>
                      <input 
                        required 
                        name="hanzi" 
                        value={formData.hanzi} 
                        onChange={handleInputChange}
                        onBlur={handleHanziBlur}
                        type="text" 
                        maxLength={5}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#006e2f] outline-none" 
                        placeholder="VD: 水"
                      />
                      {duplicateWarning && (
                        <p className="text-[10px] text-amber-600 font-semibold mt-1">{duplicateWarning}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dạng biến thể</label>
                      <input 
                        name="variant_form" 
                        value={formData.variant_form} 
                        onChange={handleInputChange}
                        type="text" 
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#006e2f] outline-none" 
                        placeholder="VD: 氵"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phiên âm Pinyin</label>
                      <input 
                        name="pinyin" 
                        value={formData.pinyin} 
                        onChange={handleInputChange}
                        type="text" 
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#006e2f] outline-none" 
                        placeholder="VD: shuǐ"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên Hán Việt</label>
                      <input 
                        name="name_vi" 
                        value={formData.name_vi} 
                        onChange={handleInputChange}
                        type="text" 
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#006e2f] outline-none" 
                        placeholder="VD: Thủy"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ý nghĩa bộ thủ</label>
                    <input 
                      name="meaning" 
                      value={formData.meaning} 
                      onChange={handleInputChange}
                      type="text" 
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#006e2f] outline-none" 
                      placeholder="VD: Nước (nước chảy)"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số nét vẽ *</label>
                      <input 
                        required
                        name="stroke_count" 
                        value={formData.stroke_count} 
                        onChange={handleInputChange}
                        type="number" 
                        min={1}
                        max={17}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#006e2f] outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vị trí kết cấu</label>
                      <select 
                        name="position" 
                        value={formData.position} 
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#006e2f] outline-none bg-white"
                      >
                        <option value="left">Bên trái (left)</option>
                        <option value="right">Bên phải (right)</option>
                        <option value="top">Ở trên (top)</option>
                        <option value="bottom">Ở dưới (bottom)</option>
                        <option value="enclosure">Bao quanh (enclosure)</option>
                        <option value="any">Nằm bất kỳ (any)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Thể loại</label>
                      <select 
                        name="is_simplified" 
                        value={String(formData.is_simplified)} 
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#006e2f] outline-none bg-white"
                      >
                        <option value="true">Giản thể</option>
                        <option value="false">Phồn thể</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Audio Uploader component integration */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tải lên file phát âm (Audio)</label>
                      <div className="flex gap-2">
                        <input 
                          name="audio_url" 
                          value={formData.audio_url} 
                          onChange={handleInputChange}
                          type="text" 
                          placeholder="Chọn file tải lên..."
                          className="flex-1 border border-gray-300 rounded-lg p-2.5 text-xs focus:border-[#006e2f] outline-none bg-slate-50" 
                        />
                        <label className="px-3 bg-[#006e2f]/10 text-[#006e2f] border border-[#006e2f]/20 hover:bg-[#006e2f]/20 transition-all rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm min-w-[70px]">
                          {uploadingAudio ? 'Đang tải...' : 'Upload'}
                          <input 
                            type="file" 
                            accept="audio/*" 
                            className="hidden" 
                            onChange={(e) => handleFileUpload(e, 'audio')} 
                          />
                        </label>
                      </div>
                    </div>

                    {/* Animation Uploader - Optional */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tải lên nét viết (Animation) - Tùy chọn</label>
                      <div className="flex gap-2">
                        <input 
                          name="animation_url" 
                          value={formData.animation_url} 
                          onChange={handleInputChange}
                          type="text" 
                          placeholder="Tùy chọn — chỉ dùng nếu muốn thay thế animation mặc định..."
                          className="flex-1 border border-gray-300 rounded-lg p-2.5 text-xs focus:border-[#006e2f] outline-none bg-slate-50" 
                        />
                        <label className="px-3 bg-[#006e2f]/10 text-[#006e2f] border border-[#006e2f]/20 hover:bg-[#006e2f]/20 transition-all rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm min-w-[70px]">
                          {uploadingAnimation ? 'Đang tải...' : 'Upload'}
                          <input 
                            type="file" 
                            accept="image/gif, image/png, image/jpeg" 
                            className="hidden" 
                            onChange={(e) => handleFileUpload(e, 'animation')} 
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Câu chuyện ghi nhớ</label>
                    <textarea 
                      name="story" 
                      value={formData.story} 
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#006e2f] outline-none resize-none" 
                      placeholder="Mô tả câu chuyện thú vị để học viên dễ liên tưởng hình ảnh..."
                    />
                  </div>
                </div>

                {/* Live Preview Box using Hanzi Writer Component */}
                <div className="flex flex-col space-y-4">
                  <RadicalPreview hanzi={formData.hanzi} />
                  
                  {/* Audio preview click */}
                  {formData.audio_url && (
                    <button 
                      type="button"
                      disabled={isPlayingAudio}
                      onClick={() => handlePlayAudio(formData.audio_url)}
                      className="w-full py-2.5 bg-[#006e2f] hover:bg-[#005321] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[18px]">volume_up</span>
                      {isPlayingAudio ? 'Đang phát...' : 'Nghe thử phát âm'}
                    </button>
                  )}
                </div>

              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-semibold transition-all cursor-pointer">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-[#006e2f] hover:bg-[#005321] text-white rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer">
                  {activeModal === 'add' ? 'Thêm mới bộ thủ' : 'Lưu cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Safety Check) */}
      {activeModal === 'delete' && selectedRadical && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-base font-bold text-gray-800">Xác nhận xóa bộ thủ</h2>
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

              {loadingUsage ? (
                <p className="text-sm text-gray-500">Đang quét mức độ ảnh hưởng của bộ thủ tới kho từ vựng...</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Bạn sắp thực hiện xóa vĩnh viễn bộ thủ: <strong className="text-2xl text-slate-800 font-serif block my-2 text-center bg-slate-50 p-3 rounded-lg border border-slate-100">{selectedRadical.hanzi}</strong> (Hán Việt: {selectedRadical.name_vi}).
                  </p>
                  
                  {usageCount > 0 ? (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 text-amber-800">
                      <span className="material-symbols-outlined text-[24px] text-amber-600 flex-shrink-0">warning</span>
                      <div className="text-xs leading-relaxed">
                        <p className="font-extrabold mb-1">Cảnh báo liên kết khóa ngoại!</p>
                        <p className="font-medium text-amber-700">
                          Bộ thủ này đang được gán cho <strong className="font-extrabold">{usageCount} từ vựng</strong> trong cơ sở dữ liệu. 
                          Nếu tiếp tục xóa, hệ thống sẽ tự động gỡ liên kết bộ thủ (đặt về null) ở các từ vựng này.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Bộ thủ này hiện không có từ vựng nào liên kết. Việc xóa diễn ra an toàn.
                    </p>
                  )}
                  
                  <p className="text-xs text-red-500 font-bold italic pt-2">
                    * Lưu ý: Thao tác xóa bộ thủ là không thể khôi phục lại!
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-semibold transition-all cursor-pointer">
                  Hủy
                </button>
                <button 
                  type="button" 
                  disabled={loadingUsage}
                  onClick={handleDeleteConfirm} 
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  Đồng ý Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
