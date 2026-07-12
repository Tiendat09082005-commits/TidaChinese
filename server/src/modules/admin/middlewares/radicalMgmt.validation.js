// Validation rules for Admin creating and updating Radicals

export const validateCreateRadical = (req, res, next) => {
  const { hanzi, stroke_count, position } = req.body

  if (!hanzi || !hanzi.trim()) {
    return res.status(400).json({ message: 'Chữ Hán bộ thủ không được để trống!' })
  }

  if (hanzi.trim().length > 5) {
    return res.status(400).json({ message: 'Chữ Hán bộ thủ không hợp lệ (tối đa 5 ký tự)!' })
  }

  if (stroke_count !== undefined && stroke_count !== null) {
    const stroke = parseInt(stroke_count)
    if (isNaN(stroke) || stroke < 1 || stroke > 17) {
      return res.status(400).json({ message: 'Số nét vẽ bộ thủ phải là số nguyên từ 1 đến 17 nét!' })
    }
  }

  const validPositions = ['left', 'right', 'top', 'bottom', 'enclosure', 'any']
  if (position && !validPositions.includes(position)) {
    return res.status(400).json({ message: 'Vị trí bộ thủ không hợp lệ (hỗ trợ left, right, top, bottom, enclosure)!' })
  }

  next()
}

export const validateUpdateRadical = (req, res, next) => {
  const { hanzi, stroke_count, position } = req.body

  if (!hanzi || !hanzi.trim()) {
    return res.status(400).json({ message: 'Chữ Hán bộ thủ không được để trống!' })
  }

  if (stroke_count !== undefined && stroke_count !== null) {
    const stroke = parseInt(stroke_count)
    if (isNaN(stroke) || stroke < 1 || stroke > 17) {
      return res.status(400).json({ message: 'Số nét vẽ bộ thủ phải là số nguyên từ 1 đến 17 nét!' })
    }
  }

  const validPositions = ['left', 'right', 'top', 'bottom', 'enclosure', 'any']
  if (position && !validPositions.includes(position)) {
    return res.status(400).json({ message: 'Vị trí bộ thủ không hợp lệ!' })
  }

  next()
}
