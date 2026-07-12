import pool from '../../../config/db.js'

// Fetch radicals list by pagination, search, and stroke filters
export const fetchRadicalsService = async ({ page, limit, search, strokeCount }) => {
  const offset = (page - 1) * limit
  
  let countQuery = 'SELECT COUNT(*) FROM radicals WHERE 1=1'
  let selectQuery = 'SELECT * FROM radicals WHERE 1=1'
  const queryParams = []
  let paramIndex = 1

  // Filter by Stroke Count
  if (strokeCount && strokeCount !== 'all') {
    countQuery += ` AND stroke_count = $${paramIndex}`
    selectQuery += ` AND stroke_count = $${paramIndex}`
    queryParams.push(parseInt(strokeCount))
    paramIndex++
  }

  // Filter by Search (hanzi, pinyin, or name_vi)
  if (search) {
    countQuery += ` AND (hanzi ILIKE $${paramIndex} OR pinyin ILIKE $${paramIndex} OR name_vi ILIKE $${paramIndex} OR meaning ILIKE $${paramIndex})`
    selectQuery += ` AND (hanzi ILIKE $${paramIndex} OR pinyin ILIKE $${paramIndex} OR name_vi ILIKE $${paramIndex} OR meaning ILIKE $${paramIndex})`
    queryParams.push(`%${search}%`)
    paramIndex++
  }

  // Sorting and Pagination
  selectQuery += ` ORDER BY stroke_count ASC, sort_order ASC, id ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
  const selectParams = [...queryParams, limit, offset]

  const totalRes = await pool.query(countQuery, queryParams)
  const radicalRes = await pool.query(selectQuery, selectParams)

  return {
    total: parseInt(totalRes.rows[0].count),
    radicals: radicalRes.rows
  }
}

// Check duplicate hanzi
export const checkDuplicateService = async (hanzi) => {
  const queryStr = 'SELECT id FROM radicals WHERE hanzi = $1'
  const result = await pool.query(queryStr, [hanzi.trim()])
  return result.rows.length > 0
}

// Get foreign key dependency usage counts
export const checkUsageService = async (id) => {
  // Count references in vocabulary
  const vocabUsageRes = await pool.query('SELECT COUNT(*) FROM vocabulary WHERE radical_id = $1', [id])
  const vocabCount = parseInt(vocabUsageRes.rows[0].count)

  // Count references in radical_characters junction table
  const characterUsageRes = await pool.query('SELECT COUNT(*) FROM radical_characters WHERE radical_id = $1', [id])
  const characterCount = parseInt(characterUsageRes.rows[0].count)

  return {
    total: vocabCount + characterCount,
    vocabCount,
    characterCount
  }
}

// Create new radical
export const createRadicalService = async (data) => {
  const { 
    hanzi, pinyin, name_vi, meaning, variant_form, stroke_count, 
    position, story, audio_url, animation_url, stroke_video_url, 
    is_simplified, sort_order 
  } = data

  const insertQuery = `
    INSERT INTO radicals (
      hanzi, pinyin, name_vi, meaning, variant_form, stroke_count, 
      position, story, audio_url, animation_url, stroke_video_url, 
      is_simplified, sort_order
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `
  
  const result = await pool.query(insertQuery, [
    hanzi.trim(),
    pinyin ? pinyin.trim() : null,
    name_vi ? name_vi.trim() : null,
    meaning ? meaning.trim() : null,
    variant_form ? variant_form.trim() : null,
    stroke_count ? parseInt(stroke_count) : null,
    position || null,
    story || null,
    audio_url || null,
    animation_url || null,
    stroke_video_url || null,
    is_simplified !== undefined ? is_simplified : true,
    sort_order ? parseInt(sort_order) : 0
  ])

  return result.rows[0]
}

// Update radical
export const updateRadicalService = async (id, data) => {
  const { 
    hanzi, pinyin, name_vi, meaning, variant_form, stroke_count, 
    position, story, audio_url, animation_url, stroke_video_url, 
    is_simplified, sort_order 
  } = data

  const updateQuery = `
    UPDATE radicals
    SET hanzi = $1, 
        pinyin = $2, 
        name_vi = $3, 
        meaning = $4, 
        variant_form = $5, 
        stroke_count = $6, 
        position = $7, 
        story = $8, 
        audio_url = $9, 
        animation_url = $10, 
        stroke_video_url = $11, 
        is_simplified = $12, 
        sort_order = $13
    WHERE id = $14
    RETURNING *
  `

  const result = await pool.query(updateQuery, [
    hanzi.trim(),
    pinyin ? pinyin.trim() : null,
    name_vi ? name_vi.trim() : null,
    meaning ? meaning.trim() : null,
    variant_form ? variant_form.trim() : null,
    stroke_count ? parseInt(stroke_count) : null,
    position || null,
    story || null,
    audio_url || null,
    animation_url || null,
    stroke_video_url || null,
    is_simplified !== undefined ? is_simplified : true,
    sort_order ? parseInt(sort_order) : 0,
    id
  ])

  return result.rows[0]
}

// Delete radical with safety cascading inside transaction
export const deleteRadicalService = async (id) => {
  // Start transactional delete to preserve data integrity
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    // Gỡ liên kết (Nullify) trong bảng vocabulary
    await client.query('UPDATE vocabulary SET radical_id = NULL WHERE radical_id = $1', [id])

    // Xóa liên kết trong bảng radical_characters
    await client.query('DELETE FROM radical_characters WHERE radical_id = $1', [id])

    // Xóa bộ thủ chính
    await client.query('DELETE FROM radicals WHERE id = $1', [id])
    
    await client.query('COMMIT')
    return { success: true, message: 'Đã xóa bộ thủ và gỡ liên kết từ vựng liên quan thành công!' }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
