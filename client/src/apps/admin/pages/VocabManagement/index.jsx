import React, { useState, useEffect } from 'react'
import {
  getVocabularies,
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
  checkDuplicateVocab,
  generateTtsAudio,
  getVocabUsage,
  bulkUpdateVocabularies,
  bulkDeleteVocabularies,
  uploadMedia
} from '../../services/vocabService'
import { getRadicals } from '../../services/radicalService'
import Toast from '../../../../shared/components/Toast'
import RadicalPreview from '../../../../shared/components/RadicalPreview'

export default function VocabManagement() {
  const [vocabularies, setVocabularies] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')
  const [hskLevel, setHskLevel] = useState('all')
  const [wordTypeId, setWordTypeId] = useState('all')
  const [topicId, setTopicId] = useState('all')
  const [radicalId, setRadicalId] = useState('all')
  const [isPublished, setIsPublished] = useState('all')

  // Loaded database items for selectors
  const [radicalsList, setRadicalsList] = useState([])
  const [wordTypesList] = useState([
    { id: 1, name: 'Danh từ' },
    { id: 2, name: 'Động từ' },
    { id: 3, name: 'Tính từ' },
    { id: 4, name: 'Phó từ' },
    { id: 5, name: 'Đại từ' },
    { id: 6, name: 'Số từ' },
    { id: 7, name: 'Lượng từ' },
    { id: 8, name: 'Giới từ' },
    { id: 9, name: 'Liên từ' },
    { id: 10, name: 'Trợ từ' },
    { id: 11, name: 'Thán từ' },
    { id: 12, name: 'Cụm từ' }
  ])
  const [topicsList] = useState([
    { id: 1, name_vi: 'Chào hỏi' },
    { id: 2, name_vi: 'Gia đình' },
    { id: 3, name_vi: 'Ăn uống' },
    { id: 4, name_vi: 'Thời gian' },
    { id: 5, name_vi: 'Mua sắm' },
    { id: 6, name_vi: 'Thời tiết' },
    { id: 7, name_vi: 'Sức khỏe' },
    { id: 8, name_vi: 'Công việc' },
    { id: 9, name_vi: 'Du lịch' },
    { id: 10, name_vi: 'Học tập' }
  ])

  // Bulk actions & Selection
  const [selectedIds, setSelectedIds] = useState([])
  
  // Loading & Alerts
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Modals States
  const [activeModal, setActiveModal] = useState(null) // 'add' | 'edit' | 'delete' | 'csv'
  const [selectedVocab, setSelectedVocab] = useState(null)
  const [activeTab, setActiveTab] = useState('basic') // 'basic' | 'media' | 'relations' | 'examples'

  // Form Fields State
  const [formData, setFormData] = useState({
    hanzi: '',
    pinyin: '',
    meaning_vi: '',
    meaning_en: '',
    hsk_level: 1,
    word_type_id: 1,
    topic_id: 1,
    audio_male_url: '',
    audio_female_url: '',
    stroke_video_url: '',
    stroke_grid_url: '',
    stroke_count: 1,
    radical_id: '',
    radical_ids: [], // Array of radical IDs for multi-select
    frequency_rank: 0,
    synonyms: [], // Array of vocabulary IDs
    antonyms: [],  // Array of vocabulary IDs
    collocations: [], // Array of strings
    is_published: true,
    components: [], // Array of { component_hanzi, component_meaning, sort_order }
    examples: [] // Array of { sentence_zh, sentence_pinyin, sentence_vi, audio_url, sort_order, is_published }
  })

  // Auxiliary UI states
  const [generatingTts, setGeneratingTts] = useState(false)
  const [uploadingMediaFlag, setUploadingMediaFlag] = useState({ type: null })
  const [duplicateWarning, setDuplicateWarning] = useState('')
  const [usageCount, setUsageCount] = useState(0)
  const [loadingUsage, setLoadingUsage] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  // Autocomplete state for Synonyms and Antonyms
  const [searchQuery, setSearchQuery] = useState({ synonyms: '', antonyms: '' })
  const [searchResults, setSearchResults] = useState({ synonyms: [], antonyms: [] })

  // Inline Components management state
  const [newComp, setNewComp] = useState({ component_hanzi: '', component_meaning: '', sort_order: 0 })

  // Searchable combobox states for Radical Select
  const [radicalSearch, setRadicalSearch] = useState('')
  const [isRadicalFocused, setIsRadicalFocused] = useState(false)

  // Inline Examples management state
  const [newEx, setNewEx] = useState({ sentence_zh: '', sentence_pinyin: '', sentence_vi: '', audio_url: '', sort_order: 0, is_published: true })

  // CSV Import state
  const [csvFile, setCsvFile] = useState(null)
  const [csvImporting, setCsvImporting] = useState(false)

  // Fetch Radicals List for selector dropdown
  const fetchAllRadicalsForSelect = async () => {
    try {
      const res = await getRadicals({ page: 1, limit: 300 })
      if (res.data && res.data.success) {
        setRadicalsList(res.data.radicals)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Fetch Vocabularies
  const fetchVocabularies = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const response = await getVocabularies({
        page,
        limit,
        search,
        hskLevel: hskLevel === 'all' ? '' : hskLevel,
        wordTypeId: wordTypeId === 'all' ? '' : wordTypeId,
        topicId: topicId === 'all' ? '' : topicId,
        radicalId: radicalId === 'all' ? '' : radicalId,
        isPublished: isPublished === 'all' ? '' : isPublished
      })
      if (response.data && response.data.success) {
        setVocabularies(response.data.vocabularies)
        setTotal(response.data.total)
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Lỗi hệ thống khi tải danh sách từ vựng!')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllRadicalsForSelect()
  }, [])

  useEffect(() => {
    fetchVocabularies()
  }, [page, hskLevel, wordTypeId, topicId, radicalId, isPublished])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchVocabularies()
  }

  // Row Selection logic
  const handleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(vocabularies.map(v => v.id))
    } else {
      setSelectedIds([])
    }
  }

  // Play audio
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    let finalValue = value
    if (type === 'checkbox') {
      finalValue = checked
    } else if (name === 'hsk_level' || name === 'word_type_id' || name === 'topic_id' || name === 'stroke_count' || name === 'frequency_rank') {
      finalValue = value === '' ? '' : parseInt(value)
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }))
  }

  // Real-time unique check for Hanzi word
  const handleHanziBlur = async () => {
    if (!formData.hanzi.trim() || activeModal === 'edit') return
    try {
      const res = await checkDuplicateVocab(formData.hanzi.trim())
      if (res.data && res.data.duplicate) {
        setDuplicateWarning(`Cảnh báo: Từ vựng "${formData.hanzi}" đã tồn tại trong hệ thống!`)
      } else {
        setDuplicateWarning('')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Generate Edge TTS male/female audio
  const handleGenerateTts = async () => {
    if (!formData.hanzi.trim()) {
      setErrorMsg('Vui lòng nhập chữ Hán ở Tab 1 trước khi sinh âm thanh!')
      return
    }
    setGeneratingTts(true)
    setErrorMsg('')
    try {
      const res = await generateTtsAudio(formData.hanzi.trim())
      if (res.data && res.data.success) {
        setFormData(prev => ({
          ...prev,
          audio_male_url: res.data.audio_male_url,
          audio_female_url: res.data.audio_female_url
        }))
        setSuccessMsg(res.data.message)
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi sinh âm thanh tự động!')
    } finally {
      setGeneratingTts(false)
    }
  }

  // Media file uploader (optional manual upload override)
  const handleMediaUpload = async (e, typeKey) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingMediaFlag({ type: typeKey })
    try {
      const uploadType = typeKey.includes('audio') ? 'audio' : 'image'
      const res = await uploadMedia(file, uploadType)
      if (res.data && res.data.success) {
        setFormData(prev => ({
          ...prev,
          [typeKey]: res.data.url
        }))
        setSuccessMsg(`Tải lên tệp thành công!`)
      }
    } catch (e) {
      setErrorMsg('Lỗi khi tải file lên Cloudinary!')
    } finally {
      setUploadingMediaFlag({ type: null })
    }
  }

  // Examples examples custom file upload
  const handleExampleAudioUpload = async (e, index) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const res = await uploadMedia(file, 'audio')
      if (res.data && res.data.success) {
        const updatedEx = [...formData.examples]
        updatedEx[index].audio_url = res.data.url
        setFormData(prev => ({ ...prev, examples: updatedEx }))
        setSuccessMsg('Tải lên âm thanh câu ví dụ thành công!')
      }
    } catch (e) {
      setErrorMsg('Lỗi khi tải file âm thanh câu ví dụ!')
    }
  }

  // Autocomplete Search helper for Synonyms/Antonyms
  const handleRelationSearch = async (query, relationType) => {
    setSearchQuery(prev => ({ ...prev, [relationType]: query }))
    if (!query.trim()) {
      setSearchResults(prev => ({ ...prev, [relationType]: [] }))
      return
    }

    try {
      const res = await getVocabularies({ search: query, limit: 5 })
      if (res.data && res.data.success) {
        setSearchResults(prev => ({ ...prev, [relationType]: res.data.vocabularies }))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSelectRelation = (vocabItem, relationType) => {
    // Avoid double entries
    if (formData[relationType].some(x => x.id === vocabItem.id)) return

    setFormData(prev => ({
      ...prev,
      [relationType]: [...prev[relationType], { id: vocabItem.id, hanzi: vocabItem.hanzi, pinyin: vocabItem.pinyin, meaning_vi: vocabItem.meaning_vi }]
    }))

    // Clear search
    setSearchQuery(prev => ({ ...prev, [relationType]: '' }))
    setSearchResults(prev => ({ ...prev, [relationType]: [] }))
  }

  const handleRemoveRelation = (id, relationType) => {
    setFormData(prev => ({
      ...prev,
      [relationType]: prev[relationType].filter(x => x.id !== id)
    }))
  }

  // Inline Components List Handlers
  const handleAddComponent = () => {
    if (!newComp.component_hanzi.trim()) return
    setFormData(prev => ({
      ...prev,
      components: [...prev.components, { ...newComp, sort_order: prev.components.length }]
    }))
    setNewComp({ component_hanzi: '', component_meaning: '', sort_order: 0 })
  }

  const handleRemoveComponent = (index) => {
    setFormData(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index)
    }))
  }

  // Inline Examples List Handlers
  const handleAddExample = () => {
    if (!newEx.sentence_zh.trim()) return
    setFormData(prev => ({
      ...prev,
      examples: [...prev.examples, { ...newEx, sort_order: prev.examples.length }]
    }))
    setNewEx({ sentence_zh: '', sentence_pinyin: '', sentence_vi: '', audio_url: '', sort_order: 0, is_published: true })
  }

  const handleRemoveExample = (index) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index)
    }))
  }

  const handleReorderExample = (index, direction) => {
    const list = [...formData.examples]
    if (direction === 'up' && index > 0) {
      const temp = list[index]
      list[index] = list[index - 1]
      list[index - 1] = temp
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index]
      list[index] = list[index + 1]
      list[index + 1] = temp
    }

    // Refresh sort_order fields
    const updated = list.map((item, idx) => ({ ...item, sort_order: idx }))
    setFormData(prev => ({ ...prev, examples: updated }))
  }

  // Modals operations
  const openAddModal = () => {
    setFormData({
      hanzi: '',
      pinyin: '',
      meaning_vi: '',
      meaning_en: '',
      hsk_level: 1,
      word_type_id: 1,
      topic_id: 1,
      audio_male_url: '',
      audio_female_url: '',
      stroke_video_url: '',
      stroke_grid_url: '',
      stroke_count: 1,
      radical_id: '',
      radical_ids: [],
      frequency_rank: 0,
      synonyms: [],
      antonyms: [],
      collocations: [],
      is_published: true,
      components: [],
      examples: []
    })
    setDuplicateWarning('')
    setErrorMsg('')
    setActiveTab('basic')
    setActiveModal('add')
  }

  const openEditModal = (vocab) => {
    setErrorMsg('')
    setDuplicateWarning('')
    setSelectedVocab(vocab)
    setActiveTab('basic')

    // Parse synonyms and antonyms from JSONB. In db they might be saved as array of IDs or objects.
    // Let's ensure they map as arrays.
    let syns = []
    let ants = []
    try {
      syns = typeof vocab.synonyms === 'string' ? JSON.parse(vocab.synonyms) : (vocab.synonyms || [])
      ants = typeof vocab.antonyms === 'string' ? JSON.parse(vocab.antonyms) : (vocab.antonyms || [])
    } catch(e) {
      console.error(e)
    }

    // Load detailed components and examples inside the vocab
    // We will parse components and examples from fetched details or just keep them
    // For standard lists we need to fetch them. Wait! When fetching list of vocabularies, does it fetch components?
    // Let's call details API or build components list inside edit form
    // Since our query fetches v.*, we should retrieve components and examples.
    // Wait, let's write components and examples into state. We can fetch them by calling a select query inside service, or if we didn't write details API, we can build it.
    // Actually, in `VocabManagement` we can get details. Let's create an API endpoint to fetch components/examples if needed, or query them.
    // Wait! Let's check: does the backend list select components?
    // Let's add a small helper service/API to get components/examples of a vocabulary item, or fetch them:
    // Let's make a quick API request to get details:
    // We can fetch `/vocabularies/:id/details` or just fetch relations:
    // Let's write client api calls or use pool query in backend. In fact, since we didn't add a /details endpoint, let's look at what details we need to fetch.
    // Wait! In `VocabManagement` edit page, we can query relations by creating a details controller or query them from DB.
    // Let's check if we can fetch detail components/examples inside `openEditModal`!
    // Since we didn't register `/vocabularies/:id` details route, let's check: did we register a route to get a single vocabulary?
    // Let's view `vocabMgmt.controller.js` to see if we wrote `getVocabularyById` or similar. No, we only wrote CRUD.
    // Wait, we can get components and examples from backend details. Let's check how we can fetch them.
    // Wait! Can we write a backend route for details?
    // Actually, we can add a route `GET /vocabularies/:id` to fetch everything (including components, examples, synonyms objects)!
    // That is a crucial addition! Let's write `getVocabularyById` on the backend and wire it to a service that returns `{ vocabulary, components, examples }`!
    // Yes! Let's do that right after setting up the form page.

    setFormData({
      hanzi: vocab.hanzi,
      pinyin: vocab.pinyin || '',
      meaning_vi: vocab.meaning_vi || '',
      meaning_en: vocab.meaning_en || '',
      hsk_level: vocab.hsk_level || 1,
      word_type_id: vocab.word_type_id || 1,
      topic_id: vocab.topic_id || 1,
      audio_male_url: vocab.audio_male_url || '',
      audio_female_url: vocab.audio_female_url || '',
      stroke_video_url: vocab.stroke_video_url || '',
      stroke_grid_url: vocab.stroke_grid_url || '',
      stroke_count: vocab.stroke_count || 1,
      radical_id: vocab.radical_id || '',
      radical_ids: vocab.radical_id ? [vocab.radical_id] : [],
      frequency_rank: vocab.frequency_rank || 0,
      synonyms: syns,
      antonyms: ants,
      collocations: vocab.collocations || [],
      is_published: vocab.is_published !== false,
      components: vocab.components || [],
      examples: vocab.examples || []
    })

    // Fetch details (components and examples) from the backend
    fetchVocabDetails(vocab.id)

    setActiveModal('edit')
  }

  const fetchVocabDetails = async (id) => {
    try {
      const res = await adminApi.get(`/vocabularies/${id}`)
      if (res.data && res.data.success) {
        setFormData(prev => ({
          ...prev,
          components: res.data.components || [],
          examples: res.data.examples || [],
          synonyms: res.data.synonyms || [],
          antonyms: res.data.antonyms || [],
          radical_ids: res.data.radical_ids || []
        }))
      }
    } catch (e) {
      console.error('Lỗi khi tải chi tiết cấu tạo và câu ví dụ từ vựng:', e)
    }
  }

  const openDeleteModal = async (vocab) => {
    setErrorMsg('')
    setSelectedVocab(vocab)
    setLoadingUsage(true)
    setActiveModal('delete')

    try {
      const res = await getVocabUsage(vocab.id)
      if (res.data && res.data.success) {
        setUsageCount(res.data.usageCount)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingUsage(false)
    }
  }

  // Handle submit form (create/update)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!formData.hanzi.trim() || !formData.meaning_vi.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ các thông tin bắt buộc (*)!')
      return
    }

    try {
      if (activeModal === 'add') {
        await createVocabulary(formData)
        setSuccessMsg('Thêm từ vựng mới thành công!')
      } else {
        await updateVocabulary(selectedVocab.id, formData)
        setSuccessMsg('Cập nhật thông tin từ vựng thành công!')
      }
      setTimeout(() => {
        setActiveModal(null)
        fetchVocabularies()
      }, 1000)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi lưu trữ thông tin từ vựng!')
    }
  }

  const handleDelete = async () => {
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await deleteVocabulary(selectedVocab.id)
      setSuccessMsg('Xóa từ vựng khỏi hệ thống thành công!')
      setTimeout(() => {
        setActiveModal(null)
        fetchVocabularies()
      }, 1000)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi xóa từ vựng!')
    }
  }

  // Bulk Actions submissions
  const handleBulkPublish = async (status) => {
    if (selectedIds.length === 0) return
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await bulkUpdateVocabularies(selectedIds, status)
      setSuccessMsg(`Đã cập nhật trạng thái xuất bản cho ${selectedIds.length} từ vựng!`)
      setSelectedIds([])
      fetchVocabularies()
    } catch (e) {
      setErrorMsg('Lỗi cập nhật hàng loạt từ vựng!')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0 || !window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} từ vựng đã chọn? Hành động này sẽ xóa vĩnh viễn dữ liệu.`)) return
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await bulkDeleteVocabularies(selectedIds)
      setSuccessMsg(`Đã xóa hàng loạt ${selectedIds.length} từ vựng khỏi hệ thống!`)
      setSelectedIds([])
      fetchVocabularies()
    } catch (e) {
      setErrorMsg('Lỗi xóa hàng loạt từ vựng!')
    }
  }

  // Handle CSV Import
  const handleCsvImport = async (e) => {
    e.preventDefault()
    if (!csvFile) {
      setErrorMsg('Vui lòng chọn file CSV trước khi import!')
      return
    }

    setCsvImporting(true)
    setErrorMsg('')
    setSuccessMsg('')

    const uploadData = new FormData()
    uploadData.append('file', csvFile)

    try {
      // Direct call to admin upload CSV parser
      const res = await adminApi.post('/vocabularies/import-csv', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (res.data && res.data.success) {
        setSuccessMsg(res.data.message || 'Import danh sách từ vựng thành công!')
        setTimeout(() => {
          setActiveModal(null)
          fetchVocabularies()
        }, 1500)
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi phân tích và lưu file CSV!')
    } finally {
      setCsvImporting(false)
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 md:space-y-8 min-h-screen">
      {/* Toast Alert */}
      {successMsg && <Toast message={successMsg} type="success" onClose={() => setSuccessMsg('')} />}
      {errorMsg && <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006e2f] text-3xl font-bold">dictionary</span>
            Quản lý Từ vựng
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý từ vựng HSK, các cấp độ từ, nghĩa Việt/Anh, cấu tạo chữ, ví dụ và tệp âm thanh giọng đọc.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setActiveModal('csv')}
            className="flex items-center gap-1.5 px-4 h-10 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">publish</span>
            Import CSV
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-5 h-10 rounded-xl text-xs font-black bg-[#006e2f] text-white hover:bg-[#005723] transition-all cursor-pointer shadow-sm shadow-[#006e2f]/20 animate-in fade-in"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Thêm từ vựng
          </button>
        </div>
      </div>

      {/* Advanced Filters Block */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
        {/* Row 1: Search Form */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-lg">
          <div className="relative flex-1 group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#006e2f] transition-colors">search</span>
            <input
              type="text"
              placeholder="Tìm kiếm từ vựng bằng chữ Hán, Pinyin, nghĩa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#f3fcef]/30 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-[#006e2f] focus:bg-white outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 h-10 bg-[#006e2f] text-white font-bold rounded-xl text-xs hover:bg-[#005723] transition-all cursor-pointer"
          >
            Tìm kiếm
          </button>
        </form>

        <hr className="border-gray-100" />

        {/* Row 2: Selectors */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {/* HSK Level filter */}
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Cấp độ HSK</label>
            <div className="relative flex items-center">
              <select
                value={hskLevel}
                onChange={(e) => { setHskLevel(e.target.value); setPage(1); }}
                className="w-full text-xs font-bold bg-[#f3fcef]/30 border border-gray-200 rounded-xl py-2.5 pl-3.5 pr-8 focus:border-[#006e2f] focus:bg-white outline-none appearance-none !bg-none transition-all cursor-pointer text-gray-700"
              >
                <option value="all">Tất cả HSK</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                  <option key={i} value={i}>HSK {i}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 pointer-events-none text-gray-400 text-[18px]">expand_more</span>
            </div>
          </div>

          {/* Word Types filter */}
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Loại từ</label>
            <div className="relative flex items-center">
              <select
                value={wordTypeId}
                onChange={(e) => { setWordTypeId(e.target.value); setPage(1); }}
                className="w-full text-xs font-bold bg-[#f3fcef]/30 border border-gray-200 rounded-xl py-2.5 pl-3.5 pr-8 focus:border-[#006e2f] focus:bg-white outline-none appearance-none !bg-none transition-all cursor-pointer text-gray-700"
              >
                <option value="all">Tất cả loại từ</option>
                {wordTypesList.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 pointer-events-none text-gray-400 text-[18px]">expand_more</span>
            </div>
          </div>

          {/* Topics filter */}
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Chủ đề</label>
            <div className="relative flex items-center">
              <select
                value={topicId}
                onChange={(e) => { setTopicId(e.target.value); setPage(1); }}
                className="w-full text-xs font-bold bg-[#f3fcef]/30 border border-gray-200 rounded-xl py-2.5 pl-3.5 pr-8 focus:border-[#006e2f] focus:bg-white outline-none appearance-none !bg-none transition-all cursor-pointer text-gray-700"
              >
                <option value="all">Tất cả chủ đề</option>
                {topicsList.map(t => (
                  <option key={t.id} value={t.id}>{t.name_vi}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 pointer-events-none text-gray-400 text-[18px]">expand_more</span>
            </div>
          </div>

          {/* Radicals filter */}
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Bộ thủ chính</label>
            <div className="relative flex items-center">
              <select
                value={radicalId}
                onChange={(e) => { setRadicalId(e.target.value); setPage(1); }}
                className="w-full text-xs font-bold bg-[#f3fcef]/30 border border-gray-200 rounded-xl py-2.5 pl-3.5 pr-8 focus:border-[#006e2f] focus:bg-white outline-none appearance-none !bg-none transition-all cursor-pointer text-gray-700"
              >
                <option value="all">Tất cả bộ thủ</option>
                {radicalsList.map(r => (
                  <option key={r.id} value={r.id}>{r.hanzi} - {r.name_vi}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 pointer-events-none text-gray-400 text-[18px]">expand_more</span>
            </div>
          </div>

          {/* Published filter */}
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Trạng thái</label>
            <div className="relative flex items-center">
              <select
                value={isPublished}
                onChange={(e) => { setIsPublished(e.target.value); setPage(1); }}
                className="w-full text-xs font-bold bg-[#f3fcef]/30 border border-gray-200 rounded-xl py-2.5 pl-3.5 pr-8 focus:border-[#006e2f] focus:bg-white outline-none appearance-none !bg-none transition-all cursor-pointer text-gray-700"
              >
                <option value="all">Tất cả</option>
                <option value="true">Đã xuất bản</option>
                <option value="false">Nháp (Gỡ)</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 pointer-events-none text-gray-400 text-[18px]">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk actions panel */}
      {selectedIds.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between text-emerald-800 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">check_box</span>
            <span className="text-xs font-bold">Đang chọn <strong className="text-emerald-950 font-black">{selectedIds.length}</strong> từ vựng</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkPublish(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] cursor-pointer transition-all"
            >
              Xuất bản
            </button>
            <button
              onClick={() => handleBulkPublish(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-500 hover:bg-slate-600 text-white font-bold text-[11px] cursor-pointer transition-all"
            >
              Gỡ hiển thị
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer transition-all"
            >
              Xóa hàng loạt
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-400 font-bold">
            <div className="w-8 h-8 border-4 border-[#006e2f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Đang tải dữ liệu từ vựng...
          </div>
        ) : vocabularies.length === 0 ? (
          <div className="p-16 text-center text-gray-400 font-bold">
            Không tìm thấy từ vựng nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-black uppercase text-[10px] tracking-wider select-none">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedIds.length === vocabularies.length && vocabularies.length > 0}
                    />
                  </th>
                  <th className="p-4 w-20 text-center">Chữ Hán</th>
                  <th className="p-4 w-24">Phiên âm</th>
                  <th className="p-4 w-20 text-center">Cấp HSK</th>
                  <th className="p-4 w-28">Loại từ</th>
                  <th className="p-4">Nghĩa tiếng Việt</th>
                  <th className="p-4 w-24 text-center">Bộ thủ</th>
                  <th className="p-4 w-28 text-center">Số câu ví dụ</th>
                  <th className="p-4 w-24 text-center">Trạng thái</th>
                  <th className="p-4 w-32 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                {vocabularies.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleSelectRow(item.id)}
                      />
                    </td>
                    <td className="p-4 text-center font-black text-lg text-[#006e2f]">{item.hanzi}</td>
                    <td className="p-4 text-gray-500 font-bold">{item.pinyin}</td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 rounded font-black text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                        HSK {item.hsk_level}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-[11px]">{item.word_type_name || 'Không xác định'}</td>
                    <td className="p-4 text-gray-600 font-medium line-clamp-2 max-w-xs">{item.meaning_vi}</td>
                    <td className="p-4 text-center font-bold text-gray-500">
                      {item.radical_name ? (
                        <span className="bg-emerald-50 text-[#006e2f] border border-emerald-100 px-2 py-0.5 rounded">
                          {item.radical_name}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        parseInt(item.example_count) === 0 
                          ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                          : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                      }`}>
                        {item.example_count} câu
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        item.is_published 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {item.is_published ? 'Đã đăng' : 'Bản nháp'}
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-1.5">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded cursor-pointer transition-all inline-flex items-center"
                        title="Chỉnh sửa"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => openDeleteModal(item)}
                        className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded cursor-pointer transition-all inline-flex items-center"
                        title="Xóa bỏ"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!loading && total > 0 && (
          <div className="bg-gray-50/50 border-t border-gray-100 p-4 flex items-center justify-between text-xs select-none">
            <span className="font-bold text-gray-400">Hiển thị {vocabularies.length} / {total} từ vựng</span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-bold cursor-pointer disabled:opacity-50 hover:bg-gray-50 transition-all"
              >
                Trước
              </button>
              <span className="px-3 font-bold text-gray-700">Trang {page}</span>
              <button
                disabled={page * limit >= total}
                onClick={() => setPage(p => p + 1)}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-bold cursor-pointer disabled:opacity-50 hover:bg-gray-50 transition-all"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 1. Modal Thêm / Sửa từ vựng               */}
      {/* ========================================== */}
      {(activeModal === 'add' || activeModal === 'edit') && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden scale-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-base font-black text-gray-800">
                  {activeModal === 'add' ? 'Thêm Từ vựng Hán tự mới' : `Chỉnh sửa từ vựng: ${formData.hanzi}`}
                </h3>
                <p className="text-xs text-gray-400">Các trường đánh dấu (*) là thông tin bắt buộc.</p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Tab Navigation header */}
            <div className="bg-white border-b border-gray-100 flex px-6 select-none">
              {[
                { id: 'basic', label: 'Thông tin cơ bản & Phát âm', icon: 'info' },
                { id: 'relations', label: 'Mối quan hệ (JSONB)', icon: 'hub' },
                { id: 'examples', label: 'Câu ví dụ', icon: 'format_quote' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                  className={`py-3.5 px-4 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-[#006e2f] text-[#006e2f]'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Duplicate warnings */}
              {duplicateWarning && (
                <div className="p-3 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-xs font-bold animate-pulse">
                  {duplicateWarning}
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 1: THÔNG TIN CƠ BẢN, PHÁT ÂM & CẤU TẠO CHỮ          */}
              {/* ======================================================== */}
              {activeTab === 'basic' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Input fields */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Hanzi */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Chữ Hán (*)</label>
                        <input
                          type="text"
                          name="hanzi"
                          value={formData.hanzi}
                          onChange={handleInputChange}
                          onBlur={handleHanziBlur}
                          placeholder="Ví dụ: 你好"
                          required
                          className="w-full text-sm font-bold bg-gray-50 border border-gray-200 focus:border-[#006e2f] focus:bg-white rounded-xl p-4 outline-none transition-all"
                        />
                      </div>

                      {/* Pinyin */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Phiên âm Pinyin</label>
                        <input
                          type="text"
                          name="pinyin"
                          value={formData.pinyin}
                          onChange={handleInputChange}
                          placeholder="Ví dụ: nǐ hǎo"
                          className="w-full text-sm font-semibold bg-gray-50 border border-gray-200 focus:border-[#006e2f] focus:bg-white rounded-xl p-4 outline-none transition-all"
                        />
                      </div>

                      {/* HSK level */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Cấp độ HSK</label>
                        <div className="relative flex items-center">
                          <select
                            name="hsk_level"
                            value={formData.hsk_level}
                            onChange={handleInputChange}
                            className="w-full text-sm font-bold bg-[#f3fcef]/30 border border-gray-200 rounded-xl py-4 pl-4 pr-10 focus:border-[#006e2f] focus:bg-white outline-none appearance-none !bg-none transition-all cursor-pointer text-gray-700"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                              <option key={i} value={i}>HSK {i}</option>
                            ))}
                          </select>
                          <span className="material-symbols-outlined absolute right-3.5 pointer-events-none text-gray-400 text-[18px]">expand_more</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Meaning VI */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Nghĩa tiếng Việt (*)</label>
                        <textarea
                          name="meaning_vi"
                          value={formData.meaning_vi}
                          onChange={handleInputChange}
                          required
                          rows="3"
                          placeholder="Nghĩa dịch chi tiết..."
                          className="w-full text-sm font-semibold bg-gray-50 border border-gray-200 focus:border-[#006e2f] focus:bg-white rounded-xl p-4 outline-none transition-all"
                        ></textarea>
                      </div>

                      {/* Meaning EN */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Nghĩa tiếng Anh</label>
                        <textarea
                          name="meaning_en"
                          value={formData.meaning_en}
                          onChange={handleInputChange}
                          rows="3"
                          placeholder="English translation..."
                          className="w-full text-sm font-semibold bg-gray-50 border border-gray-200 focus:border-[#006e2f] focus:bg-white rounded-xl p-4 outline-none transition-all"
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  {/* Dedicated Row: Hanzi Writer Live Preview for all characters */}
                  {formData.hanzi.trim() && (
                    <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3.5">
                      <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">draw</span>
                        Thứ tự nét viết các chữ Hán (Stroke Order Preview)
                      </h4>
                      <div className="flex flex-wrap gap-4 items-center justify-start">
                        {formData.hanzi.trim().split('').map((char, idx) => {
                          // Only preview Chinese characters
                          if (!char.match(/[\u4e00-\u9fa5]/)) return null;
                          return (
                            <div key={idx} className="flex flex-col items-center gap-2 bg-white border border-gray-200/60 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all">
                              <div className="w-[100px] h-[100px] flex items-center justify-center overflow-hidden border border-slate-50 rounded-lg bg-[#fcfdfa]">
                                <RadicalPreview hanzi={char} hideButtons={true} size={80} />
                              </div>
                              <span className="text-[10px] font-black text-gray-400">Chữ {idx + 1}: <strong className="text-[#006e2f]">{char}</strong></span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Basic settings row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Word Type */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">Loại từ</label>
                      <div className="relative flex items-center">
                        <select
                          name="word_type_id"
                          value={formData.word_type_id}
                          onChange={handleInputChange}
                          className="w-full text-sm font-bold bg-[#f3fcef]/30 border border-gray-200 rounded-xl py-4 pl-4 pr-10 focus:border-[#006e2f] focus:bg-white outline-none appearance-none !bg-none transition-all cursor-pointer text-gray-700"
                        >
                          {wordTypesList.map(type => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3.5 pointer-events-none text-gray-400 text-[18px]">expand_more</span>
                      </div>
                    </div>

                    {/* Topic */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">Chủ đề từ vựng</label>
                      <div className="relative flex items-center">
                        <select
                          name="topic_id"
                          value={formData.topic_id}
                          onChange={handleInputChange}
                          className="w-full text-sm font-bold bg-[#f3fcef]/30 border border-gray-200 rounded-xl py-4 pl-4 pr-10 focus:border-[#006e2f] focus:bg-white outline-none appearance-none !bg-none transition-all cursor-pointer text-gray-700"
                        >
                          {topicsList.map(t => (
                            <option key={t.id} value={t.id}>{t.name_vi}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3.5 pointer-events-none text-gray-400 text-[18px]">expand_more</span>
                      </div>
                    </div>

                    {/* Radical select (Searchable Multi-Select Dropdown) */}
                    <div className="relative">
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">Bộ thủ chính (Chọn nhiều)</label>
                      <div className="relative">
                        {/* Search Input */}
                        <input
                          type="text"
                          placeholder="Tìm & gán bộ thủ chính..."
                          value={radicalSearch}
                          onFocus={() => {
                            setRadicalSearch('')
                            setIsRadicalFocused(true)
                          }}
                          onBlur={() => {
                            // Delay slightly to let onMouseDown register
                            setTimeout(() => setIsRadicalFocused(false), 250)
                          }}
                          onChange={(e) => setRadicalSearch(e.target.value)}
                          className="w-full text-sm font-bold bg-[#f3fcef]/30 border border-gray-200 rounded-xl p-4 pr-10 focus:border-[#006e2f] focus:bg-white outline-none transition-all cursor-pointer text-gray-700"
                        />
                        <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[18px]">
                          {isRadicalFocused ? 'search' : 'expand_more'}
                        </span>

                        {/* Dropdown list */}
                        {isRadicalFocused && (
                          <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-gray-150 rounded-xl shadow-lg z-50 divide-y divide-gray-50 custom-scrollbar">
                            <div
                              onMouseDown={() => {
                                setFormData(prev => ({ ...prev, radical_ids: [] }))
                                setRadicalSearch('')
                              }}
                              className="p-3.5 text-xs text-rose-600 font-bold hover:bg-rose-50 cursor-pointer transition-colors"
                            >
                              Xóa tất cả lựa chọn bộ thủ
                            </div>
                            {radicalsList
                              .filter(r => {
                                const q = radicalSearch.toLowerCase().trim()
                                if (!q) return true
                                return (
                                  r.hanzi.includes(q) ||
                                  r.name_vi.toLowerCase().includes(q) ||
                                  (r.pinyin && r.pinyin.toLowerCase().includes(q))
                                )
                              })
                              .map(r => {
                                const isSelected = formData.radical_ids && formData.radical_ids.some(id => String(id) === String(r.id))
                                return (
                                  <div
                                    key={r.id}
                                    onMouseDown={() => {
                                      setFormData(prev => {
                                        const ids = prev.radical_ids || []
                                        const nextIds = ids.some(id => String(id) === String(r.id))
                                          ? ids.filter(id => String(id) !== String(r.id))
                                          : [...ids, r.id]
                                        return { ...prev, radical_ids: nextIds }
                                      })
                                    }}
                                    className={`p-3.5 text-xs font-semibold hover:bg-slate-50 cursor-pointer transition-colors flex justify-between items-center ${
                                      isSelected ? 'bg-[#006e2f]/5 text-[#006e2f] font-bold' : 'text-gray-700'
                                    }`}
                                  >
                                    <span className="flex items-center gap-2">
                                      <span className="material-symbols-outlined text-sm">
                                        {isSelected ? 'check_box' : 'check_box_outline_blank'}
                                      </span>
                                      {r.hanzi} - {r.name_vi}
                                    </span>
                                    {r.stroke_count && <span className="text-[10px] text-gray-400 font-bold">{r.stroke_count} nét</span>}
                                  </div>
                                )
                              })
                            }
                          </div>
                        )}
                      </div>

                      {/* Display selected radical tags inline below the input */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {formData.radical_ids && formData.radical_ids.map(id => {
                          const match = radicalsList.find(r => String(r.id) === String(id))
                          if (!match) return null
                          return (
                            <span key={id} className="inline-flex items-center gap-1 bg-[#006e2f]/10 text-[#006e2f] text-[11px] font-black px-2.5 py-1 rounded-lg">
                              {match.hanzi} ({match.name_vi})
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  radical_ids: prev.radical_ids.filter(x => String(x) !== String(id))
                                }))}
                                className="text-rose-500 hover:text-rose-700 font-black cursor-pointer text-xs ml-1"
                              >
                                ×
                              </button>
                            </span>
                          )
                        })}
                        {(!formData.radical_ids || formData.radical_ids.length === 0) && (
                          <span className="text-gray-400 text-xs italic">Chưa chọn bộ thủ nào</span>
                        )}
                      </div>
                    </div>

                    {/* Stroke Count */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">Số nét vẽ</label>
                      <input
                        type="number"
                        name="stroke_count"
                        value={formData.stroke_count}
                        onChange={handleInputChange}
                        min="1"
                        max="60"
                        className="w-full text-sm font-bold bg-gray-50 border border-gray-200 focus:border-[#006e2f] focus:bg-white rounded-xl p-4 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Frequency rank */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">Tần suất sử dụng</label>
                      <div className="relative flex items-center">
                        <select
                          name="frequency_rank"
                          value={formData.frequency_rank}
                          onChange={(e) => setFormData(prev => ({ ...prev, frequency_rank: parseInt(e.target.value) || 0 }))}
                          className="w-full text-sm font-bold bg-[#f3fcef]/30 border border-gray-200 rounded-xl py-4 pl-4 pr-10 focus:border-[#006e2f] focus:bg-white outline-none appearance-none !bg-none transition-all cursor-pointer text-gray-700"
                        >
                          <option value={0}>Không xác định (Mặc định)</option>
                          <option value={1}>Rất cao (Rất thông dụng)</option>
                          <option value={2}>Cao (Thông dụng)</option>
                          <option value={3}>Trung bình</option>
                          <option value={4}>Thấp (Ít dùng)</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3.5 pointer-events-none text-gray-400 text-[18px]">expand_more</span>
                      </div>
                    </div>

                    {/* Publish checkbox */}
                    <div className="flex items-center gap-2 pt-8 md:col-span-2">
                      <input
                        type="checkbox"
                        id="is_published"
                        name="is_published"
                        checked={formData.is_published}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-[#006e2f] rounded border-gray-300"
                      />
                      <label htmlFor="is_published" className="text-xs font-bold text-gray-600 select-none">
                        Xuất bản công khai từ vựng này ngay lập tức
                      </label>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Audio files upload & TTS Generation Section */}
                  <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-3">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">volume_up</span>
                          Âm thanh & Phát âm từ vựng
                        </h4>
                        <p className="text-[10px] text-gray-400 leading-normal">
                          Sinh audio tự động bằng công nghệ Edge TTS hoặc tải lên file âm thanh giọng chuẩn lên Cloudinary.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={generatingTts}
                        onClick={handleGenerateTts}
                        className="px-4 h-9 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0"
                      >
                        {generatingTts ? (
                          <>
                            <div className="w-3 h-3 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
                            Đang sinh...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[14px]">graphic_eq</span>
                            Tự động sinh Edge TTS
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Audio Male */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-gray-400">Giọng đọc Nam (Male)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            name="audio_male_url"
                            value={formData.audio_male_url}
                            onChange={handleInputChange}
                            placeholder="Link âm thanh giọng nam..."
                            className="flex-1 text-xs bg-white border border-gray-200 focus:border-[#006e2f] rounded-xl p-2.5 outline-none font-semibold"
                          />
                          <label className="px-3 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center justify-center border">
                            Tải file
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={(e) => handleMediaUpload(e, 'audio_male_url')}
                              className="hidden"
                            />
                          </label>
                          {formData.audio_male_url && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handlePlayAudio(formData.audio_male_url)}
                                className="w-9 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center inline-flex border cursor-pointer"
                                title="Nghe chuẩn 1.0x"
                              >
                                <span className="material-symbols-outlined text-base">volume_up</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const audio = new Audio(formData.audio_male_url)
                                  audio.playbackRate = 0.5
                                  audio.play()
                                }}
                                className="w-9 h-10 bg-slate-100 hover:bg-amber-50 text-slate-500 hover:text-amber-600 rounded-xl flex items-center justify-center inline-flex border cursor-pointer"
                                title="Nghe chậm 0.5x"
                              >
                                <span className="material-symbols-outlined text-base">slow_motion_video</span>
                              </button>
                            </div>
                          )}
                        </div>
                        {uploadingMediaFlag.type === 'audio_male_url' && <p className="text-[9px] text-emerald-600 font-bold animate-pulse">Đang tải giọng nam lên Cloudinary...</p>}
                      </div>

                      {/* Audio Female */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-gray-400">Giọng đọc Nữ (Female)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            name="audio_female_url"
                            value={formData.audio_female_url}
                            onChange={handleInputChange}
                            placeholder="Link âm thanh giọng nữ..."
                            className="flex-1 text-xs bg-white border border-gray-200 focus:border-[#006e2f] rounded-xl p-2.5 outline-none font-semibold"
                          />
                          <label className="px-3 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center justify-center border">
                            Tải file
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={(e) => handleMediaUpload(e, 'audio_female_url')}
                              className="hidden"
                            />
                          </label>
                          {formData.audio_female_url && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handlePlayAudio(formData.audio_female_url)}
                                className="w-9 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center inline-flex border cursor-pointer"
                                title="Nghe chuẩn 1.0x"
                              >
                                <span className="material-symbols-outlined text-base">volume_up</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const audio = new Audio(formData.audio_female_url)
                                  audio.playbackRate = 0.5
                                  audio.play()
                                }}
                                className="w-9 h-10 bg-slate-100 hover:bg-amber-50 text-slate-500 hover:text-amber-600 rounded-xl flex items-center justify-center inline-flex border cursor-pointer"
                                title="Nghe chậm 0.5x"
                              >
                                <span className="material-symbols-outlined text-base">slow_motion_video</span>
                              </button>
                            </div>
                          )}
                        </div>
                        {uploadingMediaFlag.type === 'audio_female_url' && <p className="text-[9px] text-emerald-600 font-bold animate-pulse">Đang tải giọng nữ lên Cloudinary...</p>}
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Inline Components list */}
                  <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/30 space-y-4 shadow-sm">
                    <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-[#006e2f]">grid_view</span>
                      Cấu tạo chữ ghép (Vocabulary Components)
                    </h4>
                    
                    {/* Entry Inputs */}
                    <div className="flex flex-wrap md:flex-nowrap gap-4 items-end bg-white p-4 rounded-xl border border-gray-100">
                      <div className="flex-1 min-w-[120px]">
                        <label className="block text-[11px] text-gray-400 font-bold mb-1.5">Chữ Hán bộ phận</label>
                        <input
                          type="text"
                          value={newComp.component_hanzi}
                          onChange={(e) => setNewComp(prev => ({ ...prev, component_hanzi: e.target.value }))}
                          placeholder="VD: 女"
                          className="w-full text-sm font-bold bg-gray-50 border border-gray-200 rounded-xl p-3.5 outline-none focus:border-[#006e2f] focus:bg-white transition-all"
                        />
                      </div>
                      <div className="flex-[3] min-w-[200px]">
                        <label className="block text-[11px] text-gray-400 font-bold mb-1.5">Ý nghĩa cấu tạo</label>
                        <input
                          type="text"
                          value={newComp.component_meaning}
                          onChange={(e) => setNewComp(prev => ({ ...prev, component_meaning: e.target.value }))}
                          placeholder="VD: Con gái, phụ nữ"
                          className="w-full text-sm font-semibold bg-gray-50 border border-gray-200 rounded-xl p-3.5 outline-none focus:border-[#006e2f] focus:bg-white transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddComponent}
                        className="px-6 h-12 bg-[#006e2f] text-white rounded-xl text-sm font-black hover:bg-[#005723] transition-all cursor-pointer inline-flex items-center justify-center flex-shrink-0 active:scale-95"
                      >
                        Thêm thành phần
                      </button>
                    </div>

                    {/* Components Table */}
                    {formData.components.length > 0 ? (
                      <div className="overflow-hidden border border-gray-150 rounded-2xl bg-white shadow-sm">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-xs text-gray-400 font-black uppercase border-b border-gray-150">
                              <th className="p-4 text-center w-24">Thành phần</th>
                              <th className="p-4">Ý nghĩa cấu tạo</th>
                              <th className="p-4 w-24 text-center">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150 font-semibold text-gray-700">
                            {formData.components.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 text-center font-black text-slate-800 text-lg bg-slate-50/30">{item.component_hanzi}</td>
                                <td className="p-4 text-slate-600 font-bold text-sm">{item.component_meaning}</td>
                                <td className="p-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveComponent(idx)}
                                    className="text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                  >
                                    Xóa
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-xs italic">Từ vựng này chưa cấu hình các chữ cấu tạo.</p>
                    )}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 3: QUAN HỆ TỪ VỰNG & AUTOCOMPLETE                    */}
              {/* ======================================================== */}
              {activeTab === 'relations' && (
                <div className="space-y-6">
                  {/* Synonyms Relation Selector */}
                  <div className="border border-slate-100 bg-slate-50/30 rounded-2xl p-4 space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">join_inner</span>
                      Từ đồng nghĩa (Synonyms)
                    </h4>

                    {/* Autocomplete Input Search */}
                    <div className="relative max-w-md">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                      <input
                        type="text"
                        value={searchQuery.synonyms}
                        onChange={(e) => handleRelationSearch(e.target.value, 'synonyms')}
                        placeholder="Gõ chữ Hán từ vựng cần gán..."
                        className="w-full text-xs bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-[#006e2f]"
                      />
                      
                      {/* Dropdown list results */}
                      {searchResults.synonyms.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white border rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-gray-100 max-h-40 overflow-y-auto">
                          {searchResults.synonyms.map(item => (
                            <div
                              key={item.id}
                              onClick={() => handleSelectRelation(item, 'synonyms')}
                              className="p-3 text-xs font-bold text-gray-600 hover:bg-emerald-50 hover:text-[#006e2f] cursor-pointer flex items-center justify-between"
                            >
                              <span>{item.hanzi} ({item.pinyin})</span>
                              <span className="text-[10px] text-gray-400 font-medium">{item.meaning_vi}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Chips Display */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {formData.synonyms.length > 0 ? (
                        formData.synonyms.map(item => (
                          <div key={item.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
                            <span>{item.hanzi}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveRelation(item.id, 'synonyms')}
                              className="text-gray-400 hover:text-rose-500 font-bold ml-1 rounded-full w-4 h-4 flex items-center justify-center"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic">Chưa có từ đồng nghĩa được liên kết.</p>
                      )}
                    </div>
                  </div>

                  {/* Antonyms Relation Selector */}
                  <div className="border border-slate-100 bg-slate-50/30 rounded-2xl p-4 space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">join_left</span>
                      Từ trái nghĩa (Antonyms)
                    </h4>

                    {/* Autocomplete Input Search */}
                    <div className="relative max-w-md">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                      <input
                        type="text"
                        value={searchQuery.antonyms}
                        onChange={(e) => handleRelationSearch(e.target.value, 'antonyms')}
                        placeholder="Gõ chữ Hán từ vựng cần gán..."
                        className="w-full text-xs bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-[#006e2f]"
                      />
                      
                      {/* Dropdown list results */}
                      {searchResults.antonyms.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white border rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-gray-100 max-h-40 overflow-y-auto">
                          {searchResults.antonyms.map(item => (
                            <div
                              key={item.id}
                              onClick={() => handleSelectRelation(item, 'antonyms')}
                              className="p-3 text-xs font-bold text-gray-600 hover:bg-emerald-50 hover:text-[#006e2f] cursor-pointer flex items-center justify-between"
                            >
                              <span>{item.hanzi} ({item.pinyin})</span>
                              <span className="text-[10px] text-gray-400 font-medium">{item.meaning_vi}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Chips Display */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {formData.antonyms.length > 0 ? (
                        formData.antonyms.map(item => (
                          <div key={item.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
                            <span>{item.hanzi}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveRelation(item.id, 'antonyms')}
                              className="text-gray-400 hover:text-rose-500 font-bold ml-1 rounded-full w-4 h-4 flex items-center justify-center"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic">Chưa có từ trái nghĩa được liên kết.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 4: CÂU VÍ DỤ (Có Reordering)                         */}
              {/* ======================================================== */}
              {activeTab === 'examples' && (
                <div className="space-y-4">
                  {/* Examples Form Entry Box */}
                  <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Thêm câu ví dụ mới</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold mb-1">Câu chữ Hán (*)</label>
                        <input
                          type="text"
                          value={newEx.sentence_zh}
                          onChange={(e) => setNewEx(prev => ({ ...prev, sentence_zh: e.target.value }))}
                          placeholder="VD: 你好吗？"
                          className="w-full text-xs font-bold bg-white border border-gray-200 rounded-xl p-2.5 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold mb-1">Phiên âm Pinyin</label>
                        <input
                          type="text"
                          value={newEx.sentence_pinyin}
                          onChange={(e) => setNewEx(prev => ({ ...prev, sentence_pinyin: e.target.value }))}
                          placeholder="VD: Nǐ hǎo ma?"
                          className="w-full text-xs font-semibold bg-white border border-gray-200 rounded-xl p-2.5 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold mb-1">Nghĩa tiếng Việt</label>
                        <input
                          type="text"
                          value={newEx.sentence_vi}
                          onChange={(e) => setNewEx(prev => ({ ...prev, sentence_vi: e.target.value }))}
                          placeholder="VD: Bạn khỏe không?"
                          className="w-full text-xs font-semibold bg-white border border-gray-200 rounded-xl p-2.5 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newEx.audio_url}
                        onChange={(e) => setNewEx(prev => ({ ...prev, audio_url: e.target.value }))}
                        placeholder="Link âm thanh câu ví dụ (tùy chọn)..."
                        className="flex-1 text-xs bg-white border border-gray-200 rounded-xl p-2.5 outline-none font-semibold"
                      />
                      <button
                        type="button"
                        onClick={handleAddExample}
                        className="px-5 h-10 bg-[#006e2f] text-white rounded-xl text-xs font-bold hover:bg-[#005723] transition-all cursor-pointer"
                      >
                        Thêm câu
                      </button>
                    </div>
                  </div>

                  {/* Examples List */}
                  {formData.examples.length > 0 ? (
                    <div className="space-y-3.5">
                      {formData.examples.map((ex, idx) => (
                        <div key={idx} className="flex gap-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm items-start transition-all hover:border-gray-200">
                          {/* Reordering Controls */}
                          <div className="flex flex-col gap-1 items-center justify-center select-none pt-2">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleReorderExample(idx, 'up')}
                              className="p-1 text-gray-400 hover:text-emerald-700 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer inline-flex"
                            >
                              <span className="material-symbols-outlined text-[16px] font-bold">arrow_upward</span>
                            </button>
                            <span className="text-[10px] font-black text-gray-300">{idx + 1}</span>
                            <button
                              type="button"
                              disabled={idx === formData.examples.length - 1}
                              onClick={() => handleReorderExample(idx, 'down')}
                              className="p-1 text-gray-400 hover:text-emerald-700 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer inline-flex"
                            >
                              <span className="material-symbols-outlined text-[16px] font-bold">arrow_downward</span>
                            </button>
                          </div>

                          {/* Text Detail */}
                          <div className="flex-1 space-y-1">
                            <div className="text-sm font-black text-[#006e2f]">{ex.sentence_zh}</div>
                            <div className="text-[11px] text-gray-500 font-bold">{ex.sentence_pinyin}</div>
                            <div className="text-xs text-gray-600 font-medium">{ex.sentence_vi}</div>
                            
                            {/* Audio upload/play */}
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              {ex.audio_url ? (
                                <button
                                  type="button"
                                  onClick={() => handlePlayAudio(ex.audio_url)}
                                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-all cursor-pointer inline-flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-[14px]">volume_up</span>
                                  Nghe phát âm câu
                                </button>
                              ) : (
                                <span className="text-[10px] text-gray-300 italic font-medium">Chưa có file đọc</span>
                              )}
                              
                              {/* Audio uploader */}
                              <label className="px-2.5 py-1 rounded border border-gray-200 hover:bg-slate-50 text-slate-600 font-bold text-[10px] cursor-pointer inline-flex">
                                Tải file âm thanh câu
                                <input
                                  type="file"
                                  accept="audio/*"
                                  onChange={(e) => handleExampleAudioUpload(e, idx)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleRemoveExample(idx)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          >
                            Xóa
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-xs italic text-center py-6">Từ vựng này chưa cấu hình câu ví dụ.</p>
                  )}
                </div>
              )}

            </form>

            {/* Footer controls */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 h-10 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-600 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 h-10 bg-[#006e2f] text-white hover:bg-[#005723] rounded-xl text-xs font-bold cursor-pointer"
              >
                {activeModal === 'add' ? 'Thêm từ vựng' : 'Lưu cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. Modal Xác nhận xóa                     */}
      {/* ========================================== */}
      {activeModal === 'delete' && selectedVocab && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-6 space-y-4 scale-in">
            <h3 className="text-base font-black text-gray-800 flex items-center gap-1.5 text-rose-600">
              <span className="material-symbols-outlined">warning</span>
              Xác nhận xóa Từ vựng?
            </h3>
            
            <p className="text-xs text-gray-500 leading-normal">
              Bạn có chắc chắn muốn xóa vĩnh viễn từ vựng <strong className="text-slate-800 font-bold">"{selectedVocab.hanzi}"</strong> khỏi hệ thống? 
              Hành động này sẽ xóa sạch dữ liệu liên quan ở các bảng phụ và không thể hoàn tác.
            </p>

            {/* Safety Warning database checks details */}
            {loadingUsage ? (
              <div className="p-3.5 bg-slate-50 text-[11px] text-gray-400 font-bold rounded-xl text-center flex items-center justify-center gap-1.5">
                <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                Đang kiểm tra dữ liệu học viên...
              </div>
            ) : usageCount > 0 ? (
              <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-100 rounded-2xl text-[11px] font-bold space-y-1">
                <p className="flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">report_problem</span> CẢNH BÁO MỨC ĐỘ ẢNH HƯỞNG:</p>
                <p className="leading-normal">
                  Từ vựng này đang được lưu bởi <strong className="text-rose-950 font-black">{usageCount} học viên</strong> trong bộ thẻ học (`deck_items`). 
                  Xóa từ vựng này sẽ <strong>loại bỏ hoàn toàn</strong> khỏi thẻ học của họ và xóa tiến độ học tập (`user_vocab_progress`) liên quan!
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl text-[11px] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">verified</span>
                Hợp lệ: Từ vựng chưa được lưu trong bất kỳ bộ thẻ học viên nào.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                disabled={loadingUsage}
                onClick={() => setActiveModal(null)}
                className="px-4 h-10 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-600 cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                disabled={loadingUsage}
                onClick={handleDelete}
                className="px-5 h-10 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 shadow-sm shadow-rose-600/20"
              >
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. Modal Import CSV                        */}
      {/* ========================================== */}
      {activeModal === 'csv' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-6 scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-black text-gray-800 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-600">publish</span>
                Import Từ vựng bằng file CSV
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCsvImport} className="space-y-4 pt-4">
              <p className="text-xs text-gray-400 leading-normal">
                Chọn tệp tin CSV từ máy tính của bạn chứa danh sách từ vựng HSK. Cấu trúc tệp CSV phải tuân thủ đúng định dạng tiêu chuẩn (gồm các cột chính `hanzi`, `pinyin`, `meaning_vi`, `hsk_level`).
              </p>

              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-emerald-600 transition-all bg-gray-50/50">
                <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">upload_file</span>
                <label className="block text-xs font-bold text-emerald-700 hover:underline cursor-pointer">
                  {csvFile ? csvFile.name : 'Chọn file .csv cần import'}
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setCsvFile(null); setActiveModal(null); }}
                  className="px-4 h-10 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-600 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={csvImporting}
                  className="px-5 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {csvImporting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    'Bắt đầu Import'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
