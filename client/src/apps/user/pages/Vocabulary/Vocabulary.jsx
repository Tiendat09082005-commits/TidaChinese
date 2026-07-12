import React, { useState, useEffect } from 'react'
import userApi from '../../services/userApi'
import RadicalPreview from '../../../../shared/components/RadicalPreview'
import Toast from '../../../../shared/components/Toast'

export default function Vocabulary() {
  // Vocabulary lists & pagination
  const [vocabularies, setVocabularies] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(12)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Search & Filter state
  const [search, setSearch] = useState('')
  const [hskLevel, setHskLevel] = useState('all')
  const [wordTypeId, setWordTypeId] = useState('all')
  const [topicId, setTopicId] = useState('all')

  // Detailed modal overlay state
  const [activeVocab, setActiveVocab] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [vocabDetails, setVocabDetails] = useState({
    components: [],
    examples: [],
    synonyms: [],
    antonyms: [],
    radical_ids: []
  })

  // Audio playing states
  const [playingId, setPlayingId] = useState(null)
  const [isPlayingSlow, setIsPlayingSlow] = useState(false)

  // Static options lists matching DB
  const wordTypesList = [
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
  ]

  const topicsList = [
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
  ]

  const hskFilters = [
    { id: 'all', label: 'Tất cả' },
    ...Array.from({ length: 6 }, (_, i) => ({ id: String(i + 1), label: `HSK ${i + 1}` }))
  ]

  // Radicals list for tags resolution
  const [radicalsList, setRadicalsList] = useState([])

  const fetchRadicals = async () => {
    try {
      const res = await userApi.get('/radicals')
      if (res.data && res.data.success) {
        setRadicalsList(res.data.radicals)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Fetch vocabulary records based on parameters
  const fetchVocabularies = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await userApi.get('/vocabularies', {
        params: {
          search,
          hskLevel: hskLevel === 'all' ? '' : hskLevel,
          wordTypeId: wordTypeId === 'all' ? '' : wordTypeId,
          topicId: topicId === 'all' ? '' : topicId,
          page,
          limit
        }
      })
      if (res.data && res.data.success) {
        setVocabularies(res.data.vocabularies)
        setTotal(res.data.total)
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('Không thể kết nối đến máy chủ để tải danh sách từ vựng!')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRadicals()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search, hskLevel, wordTypeId, topicId])

  useEffect(() => {
    fetchVocabularies()
  }, [page, search, hskLevel, wordTypeId, topicId])

  // Fetch details when user clicks a card
  const handleOpenDetails = async (vocab) => {
    setActiveVocab(vocab)
    setDetailsLoading(true)
    setVocabDetails({
      components: [],
      examples: [],
      synonyms: [],
      antonyms: [],
      radical_ids: []
    })
    try {
      const res = await userApi.get(`/vocabularies/${vocab.id}`)
      if (res.data && res.data.success) {
        setVocabDetails({
          components: res.data.components || [],
          examples: res.data.examples || [],
          synonyms: res.data.synonyms || [],
          antonyms: res.data.antonyms || [],
          radical_ids: res.data.radical_ids || []
        })
      }
    } catch (e) {
      console.error(e)
      setErrorMsg('Không thể tải chi tiết từ vựng!')
    } finally {
      setDetailsLoading(false)
    }
  }

  // Pronounce audio helper
  const handlePlayAudio = (url, typeId, speed = 1.0) => {
    if (!url || playingId) return
    setPlayingId(typeId)
    setIsPlayingSlow(speed === 0.5)

    const audio = new Audio(url)
    audio.playbackRate = speed
    audio.onended = () => {
      setPlayingId(null)
      setIsPlayingSlow(false)
    }
    audio.onerror = () => {
      setPlayingId(null)
      setIsPlayingSlow(false)
      setErrorMsg('Lỗi phát âm file âm thanh!')
    }
    audio.play().catch(() => {
      setPlayingId(null)
      setIsPlayingSlow(false)
      setErrorMsg('Không thể mở file âm thanh!')
    })
  }

  // Extract only Hanzi characters for multi-character rendering
  const getHanziCharacters = (text) => {
    if (!text) return []
    return text.split('').filter(char => /\p{Script=Han}/u.test(char))
  }

  const getWordTypeName = (id) => {
    const match = wordTypesList.find(t => t.id === parseInt(id))
    return match ? match.name : 'Loại từ'
  }

  const getTopicName = (id) => {
    const match = topicsList.find(t => t.id === parseInt(id))
    return match ? match.name_vi : 'Chủ đề'
  }

  // Total pages calculation
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="w-full p-4 md:p-8 space-y-6 md:space-y-8 animate-fadeIn">
      {/* Title Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">Thư viện Từ vựng Tiếng Trung</h1>
        <p className="text-gray-500 text-sm max-w-xl">
          Tra cứu, phát âm chuẩn giọng đọc bản địa và học cách viết Hán tự sống động của các từ vựng theo giáo trình HSK mới nhất.
        </p>
      </div>

      {/* Filters Hub Card */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#006e2f] transition-colors">search</span>
            <input
              type="text"
              className="w-full bg-[#f3fcef]/50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:border-[#006e2f] focus:bg-white outline-none transition-all font-semibold"
              placeholder="Tìm kiếm bằng chữ Hán, Pinyin, nghĩa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Word Type Filter */}
          <div className="relative flex items-center">
            <select
              value={wordTypeId}
              onChange={(e) => setWordTypeId(e.target.value)}
              className="w-full text-sm font-bold bg-[#f3fcef]/30 border border-gray-200 rounded-xl py-3 pl-4 pr-10 focus:border-[#006e2f] outline-none appearance-none cursor-pointer text-gray-700"
            >
              <option value="all">Tất cả loại từ</option>
              {wordTypesList.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 pointer-events-none text-gray-400 text-[18px]">expand_more</span>
          </div>

          {/* Topic Filter */}
          <div className="relative flex items-center">
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full text-sm font-bold bg-[#f3fcef]/30 border border-gray-200 rounded-xl py-3 pl-4 pr-10 focus:border-[#006e2f] outline-none appearance-none cursor-pointer text-gray-700"
            >
              <option value="all">Tất cả chủ đề</option>
              {topicsList.map(item => (
                <option key={item.id} value={item.id}>{item.name_vi}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 pointer-events-none text-gray-400 text-[18px]">expand_more</span>
          </div>
        </div>

        {/* HSK Badges Filter Row */}
        <div className="pt-2 border-t border-gray-50">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mr-2">Cấp độ HSK:</span>
            {hskFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setHskLevel(filter.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all outline-none border flex items-center justify-center cursor-pointer ${
                  hskLevel === filter.id
                    ? 'bg-[#006e2f] text-white border-[#006e2f] shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorMsg && <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />}

      {/* Main Vocabulary List Grid */}
      {loading ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 shadow-sm text-center text-slate-400 font-bold">
          <div className="w-10 h-10 border-4 border-[#006e2f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Đang tải dữ liệu từ vựng...
        </div>
      ) : vocabularies.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 shadow-sm text-center text-slate-400 font-bold">
          Không tìm thấy từ vựng nào phù hợp với bộ lọc.
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {vocabularies.map((vocab) => (
              <div
                key={vocab.id}
                className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Badges row */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
                      HSK {vocab.hsk_level}
                    </span>
                    <span className="text-[10px] text-gray-400 font-extrabold bg-slate-50 border px-2 py-0.5 rounded">
                      {getWordTypeName(vocab.word_type_id)}
                    </span>
                  </div>

                  {/* Character & Pinyin */}
                  <div className="text-center py-2">
                    <div className="text-4xl font-black text-slate-800 tracking-wide mb-1.5 group-hover:text-[#006e2f] transition-colors">
                      {vocab.hanzi}
                    </div>
                    <div className="text-xs font-extrabold text-amber-600 tracking-wider">
                      {vocab.pinyin}
                    </div>
                  </div>

                  {/* Meaning translate */}
                  <p className="text-sm font-semibold text-gray-600 text-center line-clamp-2 px-2">
                    {vocab.meaning_vi}
                  </p>
                </div>

                {/* Footer action buttons */}
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-50">
                  {/* Native male voice play */}
                  {vocab.audio_male_url && (
                    <button
                      type="button"
                      onClick={() => handlePlayAudio(vocab.audio_male_url, `male-${vocab.id}`)}
                      className={`w-9 h-9 bg-slate-50 border rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#006e2f]/5 hover:text-[#006e2f] transition-all ${
                        playingId === `male-${vocab.id}` ? 'text-[#006e2f] animate-pulse bg-[#006e2f]/5' : 'text-slate-400'
                      }`}
                      title="Phát âm Nam"
                    >
                      <span className="material-symbols-outlined text-lg">volume_up</span>
                    </button>
                  )}
                  {/* Native female voice play */}
                  {vocab.audio_female_url && (
                    <button
                      type="button"
                      onClick={() => handlePlayAudio(vocab.audio_female_url, `female-${vocab.id}`)}
                      className={`w-9 h-9 bg-slate-50 border rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#006e2f]/5 hover:text-[#006e2f] transition-all ${
                        playingId === `female-${vocab.id}` ? 'text-[#006e2f] animate-pulse bg-[#006e2f]/5' : 'text-slate-400'
                      }`}
                      title="Phát âm Nữ"
                    >
                      <span className="material-symbols-outlined text-lg">female</span>
                    </button>
                  )}
                  {/* View Details */}
                  <button
                    type="button"
                    onClick={() => handleOpenDetails(vocab)}
                    className="flex-1 h-9 bg-slate-100 hover:bg-[#006e2f] text-slate-600 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                  >
                    <span>Xem chi tiết</span>
                    <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Learner Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="w-10 h-10 border rounded-xl flex items-center justify-center bg-white text-gray-500 hover:border-[#006e2f] hover:text-[#006e2f] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="text-xs font-bold text-gray-500 px-4">
                Trang {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="w-10 h-10 border rounded-xl flex items-center justify-center bg-white text-gray-500 hover:border-[#006e2f] hover:text-[#006e2f] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL OVERLAY */}
      {activeVocab && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-20">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-[#006e2f]/10 text-[#006e2f] text-xs font-black rounded-lg">
                  HSK {activeVocab.hsk_level}
                </span>
                <span className="text-sm font-extrabold text-gray-500">
                  {getWordTypeName(activeVocab.word_type_id)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveVocab(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-gray-400 hover:text-gray-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined font-black">close</span>
              </button>
            </div>

            {/* Modal Body */}
            {detailsLoading ? (
              <div className="flex-1 py-20 text-center text-slate-400 font-bold">
                <div className="w-8 h-8 border-4 border-[#006e2f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                Đang tải chi tiết từ vựng...
              </div>
            ) : (
              <div className="p-6 md:p-8 space-y-8 flex-1">
                {/* Visual Overview grid row */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                  {/* Left Column: live writing grid */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 flex flex-col items-center">
                      <div className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 text-center">
                        Tập viết nét Hán tự
                      </div>
                      
                      {/* Character Preview Grids */}
                      <div className="flex flex-wrap justify-center gap-3 py-2">
                        {getHanziCharacters(activeVocab.hanzi).map((char, index) => (
                          <div key={index} className="flex flex-col items-center gap-2">
                            <RadicalPreview hanzi={char} size={110} hideButtons={true} />
                            <span className="text-xs font-extrabold text-slate-400 bg-white border px-2 py-0.5 rounded">
                              {char}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 text-center mt-3 font-semibold">
                        (Rê chuột lên ô vuông đỏ để vẽ thử hoặc tự động vẽ nét)
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Definitions & Info */}
                  <div className="md:col-span-3 space-y-5">
                    <div>
                      <h2 className="text-3xl font-black text-slate-800 tracking-wide mb-1">
                        {activeVocab.hanzi}
                      </h2>
                      <div className="text-base font-black text-amber-600 tracking-wider">
                        {activeVocab.pinyin}
                      </div>
                    </div>

                    <div className="bg-[#f3fcef]/25 border border-emerald-50 rounded-2xl p-5 space-y-2">
                      <div className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
                        Nghĩa Tiếng Việt:
                      </div>
                      <p className="text-base font-bold text-slate-700">
                        {activeVocab.meaning_vi}
                      </p>
                      {activeVocab.meaning_en && (
                        <>
                          <div className="text-xs font-extrabold text-gray-400 uppercase tracking-wider pt-2">
                            English meaning:
                          </div>
                          <p className="text-sm font-semibold text-slate-500">
                            {activeVocab.meaning_en}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Meta stats */}
                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-600 bg-slate-50 p-4 rounded-2xl border border-slate-150/50">
                      <div>
                        <span className="text-gray-400 block mb-0.5">Số nét vẽ</span>
                        <strong className="text-slate-800 font-extrabold text-sm">{activeVocab.stroke_count || '--'} nét</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">Tần suất sử dụng</span>
                        <strong className="text-slate-800 font-extrabold text-sm">
                          {activeVocab.frequency_rank === 1 && 'Rất cao'}
                          {activeVocab.frequency_rank === 2 && 'Cao'}
                          {activeVocab.frequency_rank === 3 && 'Trung bình'}
                          {activeVocab.frequency_rank === 4 && 'Thấp'}
                          {(activeVocab.frequency_rank === 0 || !activeVocab.frequency_rank) && 'Mặc định'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">Chủ đề từ vựng</span>
                        <strong className="text-slate-800 font-extrabold text-sm">{getTopicName(activeVocab.topic_id)}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">Loại từ</span>
                        <strong className="text-slate-800 font-extrabold text-sm">{getWordTypeName(activeVocab.word_type_id)}</strong>
                      </div>
                    </div>

                    {/* Audio play row */}
                    <div className="flex flex-wrap gap-3 items-center">
                      <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mr-1">Nghe phát âm:</span>
                      
                      {activeVocab.audio_male_url && (
                        <div className="inline-flex gap-1.5 bg-slate-50 border p-1 rounded-xl shadow-sm">
                          <button
                            type="button"
                            onClick={() => handlePlayAudio(activeVocab.audio_male_url, 'male-detail')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 ${
                              playingId === 'male-detail' && !isPlayingSlow ? 'bg-[#006e2f] text-white' : 'hover:bg-slate-100 text-slate-600'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm font-bold">volume_up</span>
                            Giọng Nam (1.0x)
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePlayAudio(activeVocab.audio_male_url, 'male-detail', 0.5)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 ${
                              playingId === 'male-detail' && isPlayingSlow ? 'bg-amber-500 text-white' : 'hover:bg-amber-50 text-slate-500'
                            }`}
                            title="Nghe chậm giọng nam"
                          >
                            <span className="material-symbols-outlined text-sm">slow_motion_video</span>
                            Chậm (0.5x)
                          </button>
                        </div>
                      )}

                      {activeVocab.audio_female_url && (
                        <div className="inline-flex gap-1.5 bg-slate-50 border p-1 rounded-xl shadow-sm">
                          <button
                            type="button"
                            onClick={() => handlePlayAudio(activeVocab.audio_female_url, 'female-detail')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 ${
                              playingId === 'female-detail' && !isPlayingSlow ? 'bg-[#006e2f] text-white' : 'hover:bg-slate-100 text-slate-600'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm font-bold">female</span>
                            Giọng Nữ (1.0x)
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePlayAudio(activeVocab.audio_female_url, 'female-detail', 0.5)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 ${
                              playingId === 'female-detail' && isPlayingSlow ? 'bg-amber-500 text-white' : 'hover:bg-amber-50 text-slate-500'
                            }`}
                            title="Nghe chậm giọng nữ"
                          >
                            <span className="material-symbols-outlined text-sm">slow_motion_video</span>
                            Chậm (0.5x)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Radical maps */}
                {vocabDetails.radical_ids && vocabDetails.radical_ids.length > 0 && (
                  <div className="border border-slate-100 bg-slate-50/20 p-5 rounded-2xl space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#006e2f]">shape_recognition</span>
                      Bộ thủ liên kết ({vocabDetails.radical_ids.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {vocabDetails.radical_ids.map(id => {
                        const match = radicalsList.find(r => String(r.id) === String(id))
                        if (!match) return null
                        return (
                          <span key={id} className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-100 shadow-sm flex items-center gap-1">
                            <span className="text-sm font-black">{match.hanzi}</span>
                            <span>({match.name_vi})</span>
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Components (Chiết tự cấu tạo chữ ghép) */}
                {vocabDetails.components && vocabDetails.components.length > 0 && (
                  <div className="border border-slate-100 bg-slate-50/20 p-5 rounded-2xl space-y-3.5">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#006e2f]">grid_view</span>
                      Sơ đồ cấu tạo chiết tự chữ Hán
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {vocabDetails.components.map((comp, idx) => (
                        <div key={idx} className="bg-white border border-gray-150 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:border-[#006e2f] transition-all">
                          <div className="w-11 h-11 bg-slate-100 border border-slate-200 text-slate-800 text-lg font-black rounded-lg flex items-center justify-center select-none shadow-inner">
                            {comp.component_hanzi}
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 font-extrabold block uppercase mb-0.5">Thành phần {idx + 1}</span>
                            <span className="text-xs font-bold text-slate-700">{comp.component_meaning}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Examples sentences */}
                {vocabDetails.examples && vocabDetails.examples.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#006e2f]">chat_bubble_outline</span>
                      Câu ví dụ minh họa ({vocabDetails.examples.length})
                    </h4>
                    
                    <div className="space-y-3">
                      {vocabDetails.examples.map((ex, idx) => (
                        <div key={idx} className="bg-slate-50/50 border border-slate-100 hover:border-slate-200 rounded-2xl p-5 transition-all flex justify-between items-start gap-4">
                          <div className="space-y-2">
                            <div className="text-base font-black text-slate-800 tracking-wide">
                              {ex.sentence_zh}
                            </div>
                            {ex.sentence_pinyin && (
                              <div className="text-xs font-extrabold text-amber-600 tracking-wider">
                                {ex.sentence_pinyin}
                              </div>
                            )}
                            {ex.sentence_vi && (
                              <p className="text-sm font-semibold text-slate-600">
                                {ex.sentence_vi}
                              </p>
                            )}
                          </div>
                          
                          {ex.audio_url && (
                            <button
                              type="button"
                              onClick={() => handlePlayAudio(ex.audio_url, `ex-${idx}`)}
                              className={`w-9 h-9 bg-white border rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#006e2f]/5 hover:text-[#006e2f] transition-all shadow-sm ${
                                playingId === `ex-${idx}` ? 'text-[#006e2f] animate-pulse border-[#006e2f]/30 bg-[#006e2f]/5' : 'text-slate-400'
                              }`}
                              title="Nghe câu ví dụ"
                            >
                              <span className="material-symbols-outlined text-sm font-bold">volume_up</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Synonyms & Antonyms */}
                {(vocabDetails.synonyms.length > 0 || vocabDetails.antonyms.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                    {/* Synonyms */}
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-emerald-600">link_off</span>
                        Từ đồng nghĩa
                      </h4>
                      {vocabDetails.synonyms.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {vocabDetails.synonyms.map(item => (
                            <button
                              key={item.id}
                              onClick={() => handleOpenDetails(item)}
                              className="bg-emerald-50/50 hover:bg-emerald-100/50 text-emerald-700 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-emerald-100 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <span className="text-sm font-black">{item.hanzi}</span>
                              <span className="opacity-80 font-bold">({item.pinyin})</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-xs italic">Không có từ đồng nghĩa liên kết.</p>
                      )}
                    </div>

                    {/* Antonyms */}
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-rose-500">compare_arrows</span>
                        Từ trái nghĩa
                      </h4>
                      {vocabDetails.antonyms.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {vocabDetails.antonyms.map(item => (
                            <button
                              key={item.id}
                              onClick={() => handleOpenDetails(item)}
                              className="bg-rose-50/50 hover:bg-rose-100/50 text-rose-700 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-rose-100 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <span className="text-sm font-black">{item.hanzi}</span>
                              <span className="opacity-80 font-bold">({item.pinyin})</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-xs italic">Không có từ trái nghĩa liên kết.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
