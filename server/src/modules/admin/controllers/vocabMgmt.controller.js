import * as vocabService from '../services/vocabMgmt.service.js'

// GET /api/admin/vocabularies
export const getAllVocabularies = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const search = req.query.search || ''
    const hskLevel = req.query.hskLevel || ''
    const wordTypeId = req.query.wordTypeId || ''
    const topicId = req.query.topicId || ''
    const radicalId = req.query.radicalId || ''
    const isPublished = req.query.isPublished || ''

    const { total, vocabularies } = await vocabService.fetchVocabularyService({
      page,
      limit,
      search,
      hskLevel,
      wordTypeId,
      topicId,
      radicalId,
      isPublished
    })

    res.json({
      success: true,
      total,
      page,
      limit,
      vocabularies
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/admin/vocabularies/check-duplicate
export const checkDuplicateHanzi = async (req, res, next) => {
  try {
    const { hanzi } = req.query
    if (!hanzi) {
      return res.status(400).json({ message: 'Vui lòng cung cấp chữ Hán cần kiểm tra!' })
    }

    const duplicate = await vocabService.checkDuplicateHanziService(hanzi)
    res.json({
      success: true,
      duplicate: !!duplicate,
      vocabulary: duplicate
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/admin/vocabularies/generate-tts
export const generateTts = async (req, res, next) => {
  try {
    const { hanzi } = req.body
    if (!hanzi) {
      return res.status(400).json({ message: 'Vui lòng cung cấp chữ Hán để sinh phát âm!' })
    }

    const audioUrls = await vocabService.generateAudioService(hanzi)
    res.json({
      success: true,
      ...audioUrls,
      message: 'Tự động sinh giọng đọc nam/nữ thành công!'
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/admin/vocabularies
export const createVocabulary = async (req, res, next) => {
  try {
    const duplicate = await vocabService.checkDuplicateHanziService(req.body.hanzi)
    if (duplicate) {
      return res.status(400).json({ message: 'Từ vựng này đã tồn tại trong hệ thống!' })
    }

    const newVocabId = await vocabService.createVocabularyService(req.body)
    res.status(201).json({
      success: true,
      vocabId: newVocabId,
      message: 'Thêm từ vựng mới thành công!'
    })
  } catch (err) {
    next(err)
  }
}

// PUT /api/admin/vocabularies/:id
export const updateVocabulary = async (req, res, next) => {
  try {
    const { id } = req.params
    const vocabId = parseInt(id)

    // Check if updating hanzi causes duplicates
    if (req.body.hanzi) {
      const duplicate = await vocabService.checkDuplicateHanziService(req.body.hanzi)
      if (duplicate && duplicate.id !== vocabId) {
        return res.status(400).json({ message: 'Chữ Hán này đã được sử dụng ở một từ vựng khác!' })
      }
    }

    await vocabService.updateVocabularyService(vocabId, req.body)
    res.json({
      success: true,
      message: 'Cập nhật từ vựng thành công!'
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/admin/vocabularies/:id/usage
export const getVocabUsage = async (req, res, next) => {
  try {
    const { id } = req.params
    const usageCount = await vocabService.getVocabUsageCountService(parseInt(id))
    res.json({
      success: true,
      usageCount
    })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/admin/vocabularies/:id
export const deleteVocabulary = async (req, res, next) => {
  try {
    const { id } = req.params
    await vocabService.deleteVocabularyService(parseInt(id))
    res.json({
      success: true,
      message: 'Xóa từ vựng khỏi hệ thống thành công!'
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/admin/vocabularies/bulk-update
export const bulkUpdateVocabularies = async (req, res, next) => {
  try {
    const { ids, isPublished } = req.body
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn danh sách từ vựng cần cập nhật!' })
    }

    await vocabService.bulkUpdateVocabularyService(ids, isPublished)
    res.json({
      success: true,
      message: 'Cập nhật hàng loạt từ vựng thành công!'
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/admin/vocabularies/bulk-delete
export const bulkDeleteVocabularies = async (req, res, next) => {
  try {
    const { ids } = req.body
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn danh sách từ vựng cần xóa!' })
    }

    await vocabService.bulkDeleteVocabularyService(ids)
    res.json({
      success: true,
      message: 'Xóa hàng loạt từ vựng thành công!'
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/admin/vocabularies/:id
export const getVocabularyById = async (req, res, next) => {
  try {
    const { id } = req.params
    const details = await vocabService.fetchVocabularyByIdService(parseInt(id))
    if (!details) {
      return res.status(404).json({ message: 'Không tìm thấy chi tiết từ vựng!' })
    }

    res.json({
      success: true,
      ...details
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/admin/vocabularies/import-csv
export const importVocabularyCsv = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng cung cấp file CSV cần import!' })
    }

    const csvText = req.file.buffer.toString('utf-8')
    const count = await vocabService.importVocabularyCsvService(csvText)

    res.json({
      success: true,
      message: `Đã import thành công ${count} từ vựng từ tệp CSV!`,
      importedCount: count
    })
  } catch (err) {
    next(err)
  }
}
