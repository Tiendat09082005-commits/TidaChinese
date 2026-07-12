import * as radicalService from '../services/radicalMgmt.service.js'

// GET /api/admin/radicals
export const getAllRadicals = async (req, res, next) => {
  try {
    // console.log(req.body);
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const search = req.query.search || ''
    const strokeCount = req.query.strokeCount || 'all'

    const { total, radicals } = await radicalService.fetchRadicalsService({ page, limit, search, strokeCount })

    res.json({
      success: true,
      total,
      page,
      limit,
      radicals
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/admin/radicals/check-duplicate
export const checkDuplicate = async (req, res, next) => {
  try {
    const { hanzi } = req.query
    if (!hanzi) {
      return res.status(400).json({ message: 'Vui lòng cung cấp chữ Hán để kiểm tra!' })
    }

    const isDuplicate = await radicalService.checkDuplicateService(hanzi)
    res.json({
      success: true,
      isDuplicate
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/admin/radicals/:id/usage
export const checkUsage = async (req, res, next) => {
  try {
    const { id } = req.params
    const usage = await radicalService.checkUsageService(id)
    res.json({
      success: true,
      usage
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/admin/radicals
export const createRadical = async (req, res, next) => {
  try {
    // Backend double check for uniqueness
    const isDup = await radicalService.checkDuplicateService(req.body.hanzi)
    if (isDup) {
      return res.status(409).json({ message: 'Bộ thủ chữ Hán này đã tồn tại trên hệ thống!' })
    }

    const newRadical = await radicalService.createRadicalService(req.body)
    res.status(201).json({
      success: true,
      message: 'Thêm bộ thủ thành công!',
      radical: newRadical
    })
  } catch (err) {
    next(err)
  }
}

// PUT /api/admin/radicals/:id
export const updateRadical = async (req, res, next) => {
  try {
    const { id } = req.params
    const updatedRadical = await radicalService.updateRadicalService(id, req.body)

    res.json({
      success: true,
      message: 'Cập nhật bộ thủ thành công!',
      radical: updatedRadical
    })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/admin/radicals/:id
export const deleteRadical = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await radicalService.deleteRadicalService(id)
    res.json({
      success: true,
      message: result.message
    })
  } catch (err) {
    next(err)
  }
}
