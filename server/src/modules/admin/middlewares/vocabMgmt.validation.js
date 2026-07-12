// Validate data when creating a new vocabulary item
export const validateCreateVocabulary = (req, res, next) => {
  const { hanzi, meaning_vi, hsk_level, stroke_count } = req.body

  if (!hanzi || !hanzi.trim()) {
    return res.status(400).json({ message: 'Chữ Hán từ vựng không được để trống!' })
  }

  if (hanzi.trim().length > 20) {
    return res.status(400).json({ message: 'Chữ Hán từ vựng không được dài quá 20 ký tự!' })
  }

  if (!meaning_vi || !meaning_vi.trim()) {
    return res.status(400).json({ message: 'Nghĩa tiếng Việt của từ vựng không được để trống!' })
  }

  if (hsk_level !== undefined && hsk_level !== null) {
    const hsk = parseInt(hsk_level)
    if (isNaN(hsk) || hsk < 1 || hsk > 9) {
      return res.status(400).json({ message: 'Cấp độ HSK không hợp lệ (phải từ HSK 1 đến HSK 9)!' })
    }
  }

  if (stroke_count !== undefined && stroke_count !== null) {
    const strokes = parseInt(stroke_count)
    if (isNaN(strokes) || strokes < 1 || strokes > 60) {
      return res.status(400).json({ message: 'Số nét vẽ không hợp lệ (phải từ 1 đến 60 nét)!' })
    }
  }

  next()
}

// Validate data when updating a vocabulary item
export const validateUpdateVocabulary = (req, res, next) => {
  const { hanzi, meaning_vi, hsk_level, stroke_count } = req.body

  if (hanzi !== undefined && !hanzi.trim()) {
    return res.status(400).json({ message: 'Chữ Hán từ vựng không được để trống!' })
  }

  if (hanzi && hanzi.trim().length > 20) {
    return res.status(400).json({ message: 'Chữ Hán từ vựng không được dài quá 20 ký tự!' })
  }

  if (meaning_vi !== undefined && !meaning_vi.trim()) {
    return res.status(400).json({ message: 'Nghĩa tiếng Việt của từ vựng không được để trống!' })
  }

  if (hsk_level !== undefined && hsk_level !== null) {
    const hsk = parseInt(hsk_level)
    if (isNaN(hsk) || hsk < 1 || hsk > 9) {
      return res.status(400).json({ message: 'Cấp độ HSK không hợp lệ (phải từ HSK 1 đến HSK 9)!' })
    }
  }

  if (stroke_count !== undefined && stroke_count !== null) {
    const strokes = parseInt(stroke_count)
    if (isNaN(strokes) || strokes < 1 || strokes > 60) {
      return res.status(400).json({ message: 'Số nét vẽ không hợp lệ (phải từ 1 đến 60 nét)!' })
    }
  }

  next()
}
