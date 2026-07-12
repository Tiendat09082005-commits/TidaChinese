import pool from '../../../config/db.js'
import { EdgeTTS } from '@andresaya/edge-tts'
import { uploadToCloudinary, deleteFromCloudinary } from '../../shared/services/upload.service.js'
import fs from 'fs/promises'
import path from 'path'

// Helper function to generate Edge TTS audio buffer
async function generateTtsBuffer(text, voice) {
  const tts = new EdgeTTS()
  const filename = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.mp3`
  const tempFile = path.join(process.cwd(), filename)

  try {
    await tts.tts({
      text,
      outputFile: tempFile,
      voice,
      rate: '+0%',
      pitch: '+0Hz'
    })
    const buffer = await fs.readFile(tempFile)
    return buffer
  } finally {
    // Clean up temp file safely
    try {
      await fs.unlink(tempFile)
    } catch (e) {
      // Ignored if file doesn't exist
    }
  }
}

// 1. Fetch vocabulary list by filters, pagination, search
export const fetchVocabularyService = async ({ page, limit, search, hskLevel, wordTypeId, topicId, radicalId, isPublished }) => {
  const offset = (page - 1) * limit
  
  let countQuery = 'SELECT COUNT(*) FROM vocabulary WHERE 1=1'
  let selectQuery = `
    SELECT v.*, 
      (SELECT COUNT(*) FROM vocabulary_examples ve WHERE ve.vocab_id = v.id) AS example_count,
      wt.name AS word_type_name,
      t.name_vi AS topic_name,
      r.hanzi AS radical_name
    FROM vocabulary v
    LEFT JOIN word_types wt ON v.word_type_id = wt.id
    LEFT JOIN topics t ON v.topic_id = t.id
    LEFT JOIN radicals r ON v.radical_id = r.id
    WHERE 1=1
  `
  const queryParams = []
  let paramIndex = 1

  if (hskLevel) {
    countQuery += ` AND hsk_level = $${paramIndex}`
    selectQuery += ` AND hsk_level = $${paramIndex}`
    queryParams.push(parseInt(hskLevel))
    paramIndex++
  }

  if (wordTypeId) {
    countQuery += ` AND word_type_id = $${paramIndex}`
    selectQuery += ` AND word_type_id = $${paramIndex}`
    queryParams.push(parseInt(wordTypeId))
    paramIndex++
  }

  if (topicId) {
    countQuery += ` AND topic_id = $${paramIndex}`
    selectQuery += ` AND topic_id = $${paramIndex}`
    queryParams.push(parseInt(topicId))
    paramIndex++
  }

  if (radicalId) {
    countQuery += ` AND v.radical_id = $${paramIndex}`
    selectQuery += ` AND v.radical_id = $${paramIndex}`
    queryParams.push(parseInt(radicalId))
    paramIndex++
  }

  if (isPublished !== undefined && isPublished !== '') {
    countQuery += ` AND is_published = $${paramIndex}`
    selectQuery += ` AND is_published = $${paramIndex}`
    queryParams.push(isPublished === 'true')
    paramIndex++
  }

  if (search) {
    countQuery += ` AND (v.hanzi ILIKE $${paramIndex} OR v.pinyin ILIKE $${paramIndex} OR v.meaning_vi ILIKE $${paramIndex})`
    selectQuery += ` AND (v.hanzi ILIKE $${paramIndex} OR v.pinyin ILIKE $${paramIndex} OR v.meaning_vi ILIKE $${paramIndex})`
    queryParams.push(`%${search}%`)
    paramIndex++
  }

  selectQuery += ` ORDER BY v.hsk_level ASC, v.id ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
  const selectParams = [...queryParams, limit, offset]

  const totalRes = await pool.query(countQuery, queryParams)
  const vocabRes = await pool.query(selectQuery, selectParams)

  return {
    total: parseInt(totalRes.rows[0].count),
    vocabularies: vocabRes.rows
  }
}

// 2. Check if a hanzi word already exists in the database (duplicate check)
export const checkDuplicateHanziService = async (hanzi) => {
  const queryText = 'SELECT id, hanzi, pinyin, meaning_vi FROM vocabulary WHERE hanzi = $1'
  const res = await pool.query(queryText, [hanzi.trim()])
  return res.rows[0] || null
}

// 3. Generate Male/Female audio voices using Edge TTS and save to Cloudinary
export const generateAudioService = async (hanzi) => {
  if (!hanzi || !hanzi.trim()) {
    throw new Error('Chữ Hán không được để trống khi sinh audio!')
  }

  const text = hanzi.trim()
  const folder = 'tida_chinese/vocabularies/audio'

  // Generate Male audio: zh-CN-YunxiNeural
  const maleBuffer = await generateTtsBuffer(text, 'zh-CN-YunxiNeural')
  const maleUpload = await uploadToCloudinary(maleBuffer, folder, 'video')

  // Generate Female audio: zh-CN-XiaoxiaoNeural
  const femaleBuffer = await generateTtsBuffer(text, 'zh-CN-XiaoxiaoNeural')
  const femaleUpload = await uploadToCloudinary(femaleBuffer, folder, 'video')

  return {
    audio_male_url: maleUpload.secure_url,
    audio_male_public_id: maleUpload.public_id,
    audio_female_url: femaleUpload.secure_url,
    audio_female_public_id: femaleUpload.public_id
  }
}

// 4. Create new vocabulary item with transaction support
export const createVocabularyService = async (vocabData) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const {
      hanzi, pinyin, meaning_vi, meaning_en, hsk_level,
      word_type_id, topic_id, audio_male_url, audio_female_url,
      stroke_video_url, stroke_grid_url, stroke_count, radical_id, radical_ids = [],
      frequency_rank, synonyms, antonyms, collocations, is_published,
      components = [], examples = []
    } = vocabData

    // Use first radical ID as main radical_id for backward compatibility
    const mainRadicalId = radical_id || (radical_ids.length > 0 ? radical_ids[0] : null)

    // Insert main vocabulary item
    const insertVocabQuery = `
      INSERT INTO vocabulary (
        hanzi, pinyin, meaning_vi, meaning_en, hsk_level,
        word_type_id, topic_id, audio_male_url, audio_female_url,
        stroke_video_url, stroke_grid_url, stroke_count, radical_id,
        frequency_rank, synonyms, antonyms, collocations, is_published
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id
    `
    const vocabResult = await client.query(insertVocabQuery, [
      hanzi.trim(),
      pinyin ? pinyin.trim() : null,
      meaning_vi.trim(),
      meaning_en ? meaning_en.trim() : null,
      hsk_level ? parseInt(hsk_level) : null,
      word_type_id ? parseInt(word_type_id) : null,
      topic_id ? parseInt(topic_id) : null,
      audio_male_url || null,
      audio_female_url || null,
      stroke_video_url || null,
      stroke_grid_url || null,
      stroke_count ? parseInt(stroke_count) : null,
      mainRadicalId ? parseInt(mainRadicalId) : null,
      frequency_rank ? parseInt(frequency_rank) : null,
      synonyms ? JSON.stringify(synonyms) : null,
      antonyms ? JSON.stringify(antonyms) : null,
      collocations ? JSON.stringify(collocations) : null,
      is_published !== undefined ? is_published : true
    ])

    const newVocabId = vocabResult.rows[0].id

    // Insert components inline (vocabulary_components)
    if (components && components.length > 0) {
      for (const comp of components) {
        const insertCompQuery = `
          INSERT INTO vocabulary_components (vocab_id, component_hanzi, component_meaning, sort_order)
          VALUES ($1, $2, $3, $4)
        `
        await client.query(insertCompQuery, [
          newVocabId,
          comp.component_hanzi.trim(),
          comp.component_meaning ? comp.component_meaning.trim() : null,
          comp.sort_order ? parseInt(comp.sort_order) : 0
        ])
      }
    }

    // Insert examples (vocabulary_examples)
    if (examples && examples.length > 0) {
      for (const ex of examples) {
        const insertExQuery = `
          INSERT INTO vocabulary_examples (vocab_id, sentence_zh, sentence_pinyin, sentence_vi, audio_url, sort_order, is_published)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `
        await client.query(insertExQuery, [
          newVocabId,
          ex.sentence_zh.trim(),
          ex.sentence_pinyin ? ex.sentence_pinyin.trim() : null,
          ex.sentence_vi ? ex.sentence_vi.trim() : null,
          ex.audio_url || null,
          ex.sort_order ? parseInt(ex.sort_order) : 0,
          ex.is_published !== undefined ? ex.is_published : true
        ])
      }
    }

    // Insert radical mappings if radical_ids exists (radical_characters)
    const allRadicalIds = [...new Set([
      ...(radical_id ? [parseInt(radical_id)] : []),
      ...((radical_ids && Array.isArray(radical_ids)) ? radical_ids.map(id => parseInt(id)) : [])
    ])]

    if (allRadicalIds.length > 0) {
      for (const radId of allRadicalIds) {
        const insertRadMappingQuery = `
          INSERT INTO radical_characters (radical_id, vocab_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `
        await client.query(insertRadMappingQuery, [radId, newVocabId])
      }
    }

    await client.query('COMMIT')
    return newVocabId
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// 5. Update vocabulary item and sub-tables
export const updateVocabularyService = async (id, vocabData) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const {
      hanzi, pinyin, meaning_vi, meaning_en, hsk_level,
      word_type_id, topic_id, audio_male_url, audio_female_url,
      stroke_video_url, stroke_grid_url, stroke_count, radical_id, radical_ids = [],
      frequency_rank, synonyms, antonyms, collocations, is_published,
      components = [], examples = []
    } = vocabData

    // Use first radical ID as main radical_id for backward compatibility
    const mainRadicalId = radical_id || (radical_ids.length > 0 ? radical_ids[0] : null)

    // Update main vocabulary record
    const updateVocabQuery = `
      UPDATE vocabulary
      SET hanzi = $1, pinyin = $2, meaning_vi = $3, meaning_en = $4, hsk_level = $5,
          word_type_id = $6, topic_id = $7, audio_male_url = $8, audio_female_url = $9,
          stroke_video_url = $10, stroke_grid_url = $11, stroke_count = $12, radical_id = $13,
          frequency_rank = $14, synonyms = $15, antonyms = $16, collocations = $17, is_published = $18,
          updated_at = NOW()
      WHERE id = $19
    `
    await client.query(updateVocabQuery, [
      hanzi.trim(),
      pinyin ? pinyin.trim() : null,
      meaning_vi.trim(),
      meaning_en ? meaning_en.trim() : null,
      hsk_level ? parseInt(hsk_level) : null,
      word_type_id ? parseInt(word_type_id) : null,
      topic_id ? parseInt(topic_id) : null,
      audio_male_url || null,
      audio_female_url || null,
      stroke_video_url || null,
      stroke_grid_url || null,
      stroke_count ? parseInt(stroke_count) : null,
      mainRadicalId ? parseInt(mainRadicalId) : null,
      frequency_rank ? parseInt(frequency_rank) : null,
      synonyms ? JSON.stringify(synonyms) : null,
      antonyms ? JSON.stringify(antonyms) : null,
      collocations ? JSON.stringify(collocations) : null,
      is_published !== undefined ? is_published : true,
      id
    ])

    // Update components: delete old components and insert new ones
    await client.query('DELETE FROM vocabulary_components WHERE vocab_id = $1', [id])
    if (components && components.length > 0) {
      for (const comp of components) {
        const insertCompQuery = `
          INSERT INTO vocabulary_components (vocab_id, component_hanzi, component_meaning, sort_order)
          VALUES ($1, $2, $3, $4)
        `
        await client.query(insertCompQuery, [
          id,
          comp.component_hanzi.trim(),
          comp.component_meaning ? comp.component_meaning.trim() : null,
          comp.sort_order ? parseInt(comp.sort_order) : 0
        ])
      }
    }

    // Update examples: delete old examples and insert new ones
    await client.query('DELETE FROM vocabulary_examples WHERE vocab_id = $1', [id])
    if (examples && examples.length > 0) {
      for (const ex of examples) {
        const insertExQuery = `
          INSERT INTO vocabulary_examples (vocab_id, sentence_zh, sentence_pinyin, sentence_vi, audio_url, sort_order, is_published)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `
        await client.query(insertExQuery, [
          id,
          ex.sentence_zh.trim(),
          ex.sentence_pinyin ? ex.sentence_pinyin.trim() : null,
          ex.sentence_vi ? ex.sentence_vi.trim() : null,
          ex.audio_url || null,
          ex.sort_order ? parseInt(ex.sort_order) : 0,
          ex.is_published !== undefined ? ex.is_published : true
        ])
      }
    }

    // Update radical mapping: delete old mapping and insert new
    await client.query('DELETE FROM radical_characters WHERE vocab_id = $1', [id])
    const allRadicalIds = [...new Set([
      ...(radical_id ? [parseInt(radical_id)] : []),
      ...((radical_ids && Array.isArray(radical_ids)) ? radical_ids.map(id => parseInt(id)) : [])
    ])]

    if (allRadicalIds.length > 0) {
      for (const radId of allRadicalIds) {
        const insertRadMappingQuery = `
          INSERT INTO radical_characters (radical_id, vocab_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `
        await client.query(insertRadMappingQuery, [radId, id])
      }
    }

    await client.query('COMMIT')
    return true
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Helper to check vocabulary usage count in user decks before deleting
export const getVocabUsageCountService = async (id) => {
  const deckQuery = 'SELECT COUNT(DISTINCT owner_id) FROM deck_items di JOIN decks d ON di.deck_id = d.id WHERE di.vocab_id = $1'
  const result = await pool.query(deckQuery, [id])
  return parseInt(result.rows[0].count) || 0
}

// 6. Delete vocabulary item safely with dependencies cleanups
export const deleteVocabularyService = async (id) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Clean user vocabulary progress first
    await client.query('DELETE FROM user_vocab_progress WHERE vocab_id = $1', [id])
    
    // Clean deck items referencing this vocab
    await client.query('DELETE FROM deck_items WHERE vocab_id = $1', [id])

    // Clean sub-tables
    await client.query('DELETE FROM vocabulary_components WHERE vocab_id = $1', [id])
    await client.query('DELETE FROM vocabulary_examples WHERE vocab_id = $1', [id])
    await client.query('DELETE FROM radical_characters WHERE vocab_id = $1', [id])

    // Delete main vocabulary
    await client.query('DELETE FROM vocabulary WHERE id = $1', [id])

    await client.query('COMMIT')
    return true
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// 7. Bulk Update Vocabulary items (e.g. status publishing)
export const bulkUpdateVocabularyService = async (ids, isPublished) => {
  const queryText = `
    UPDATE vocabulary
    SET is_published = $1, updated_at = NOW()
    WHERE id = ANY($2::bigint[])
  `
  await pool.query(queryText, [isPublished, ids])
  return true
}

// 8. Bulk Delete Vocabulary items safely
export const bulkDeleteVocabularyService = async (ids) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Clean progress for all IDs
    await client.query('DELETE FROM user_vocab_progress WHERE vocab_id = ANY($1::bigint[])', [ids])
    
    // Clean deck items referencing these vocabs
    await client.query('DELETE FROM deck_items WHERE vocab_id = ANY($1::bigint[])', [ids])

    // Clean sub-tables
    await client.query('DELETE FROM vocabulary_components WHERE vocab_id = ANY($1::bigint[])', [ids])
    await client.query('DELETE FROM vocabulary_examples WHERE vocab_id = ANY($1::bigint[])', [ids])
    await client.query('DELETE FROM radical_characters WHERE vocab_id = ANY($1::bigint[])', [ids])

    // Delete from main vocabulary
    await client.query('DELETE FROM vocabulary WHERE id = ANY($1::bigint[])', [ids])

    await client.query('COMMIT')
    return true
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// 9. Fetch detailed vocabulary components and examples
export const fetchVocabularyByIdService = async (id) => {
  const vocabRes = await pool.query('SELECT * FROM vocabulary WHERE id = $1', [id])
  if (vocabRes.rows.length === 0) return null

  const vocab = vocabRes.rows[0]
  const compRes = await pool.query('SELECT * FROM vocabulary_components WHERE vocab_id = $1 ORDER BY sort_order ASC', [id])
  const exRes = await pool.query('SELECT * FROM vocabulary_examples WHERE vocab_id = $1 ORDER BY sort_order ASC', [id])

  let syns = []
  let ants = []
  try {
    syns = typeof vocab.synonyms === 'string' ? JSON.parse(vocab.synonyms) : (vocab.synonyms || [])
  } catch (e) {
    console.error(e)
  }
  try {
    ants = typeof vocab.antonyms === 'string' ? JSON.parse(vocab.antonyms) : (vocab.antonyms || [])
  } catch (e) {
    console.error(e)
  }

  // Fetch mapped radical IDs
  const radsRes = await pool.query('SELECT radical_id FROM radical_characters WHERE vocab_id = $1', [id])
  const radical_ids = radsRes.rows.map(r => r.radical_id)

  return {
    vocabulary: vocab,
    components: compRes.rows,
    examples: exRes.rows,
    synonyms: syns,
    antonyms: ants,
    radical_ids: radical_ids
  }
}

// Simple Helper CSV line parser
function parseCsv(bufferText) {
  const lines = bufferText.split(/\r?\n/)
  const result = []
  if (lines.length <= 1) return result

  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''))
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',')
    const row = matches.map(val => val.trim().replace(/^["']|["']$/g, ''))
    
    if (row.length === 0) continue
    const obj = {}
    headers.forEach((header, idx) => {
      obj[header] = row[idx] || ''
    })
    result.push(obj)
  }
  return result
}

// 10. Import vocabularies from CSV string
export const importVocabularyCsvService = async (bufferText) => {
  const rows = parseCsv(bufferText)
  const client = await pool.connect()
  let importedCount = 0
  
  try {
    await client.query('BEGIN')
    for (const row of rows) {
      if (!row.hanzi || !row.meaning_vi) continue

      // Check duplicate
      const checkDup = await client.query('SELECT id FROM vocabulary WHERE hanzi = $1', [row.hanzi.trim()])
      if (checkDup.rows.length > 0) continue

      const insertQuery = `
        INSERT INTO vocabulary (
          hanzi, pinyin, meaning_vi, meaning_en, hsk_level,
          word_type_id, topic_id, stroke_count, radical_id, frequency_rank, is_published
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
      `
      await client.query(insertQuery, [
        row.hanzi.trim(),
        row.pinyin ? row.pinyin.trim() : null,
        row.meaning_vi.trim(),
        row.meaning_en ? row.meaning_en.trim() : null,
        row.hsk_level ? parseInt(row.hsk_level) : 1,
        row.word_type_id ? parseInt(row.word_type_id) : null,
        row.topic_id ? parseInt(row.topic_id) : null,
        row.stroke_count ? parseInt(row.stroke_count) : null,
        row.radical_id ? parseInt(row.radical_id) : null,
        row.frequency_rank ? parseInt(row.frequency_rank) : null
      ])
      importedCount++
    }
    await client.query('COMMIT')
    return importedCount
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
