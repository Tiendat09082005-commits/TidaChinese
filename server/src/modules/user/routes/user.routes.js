import { Router } from 'express'
import { getProfile, updateProfile } from '../controllers/profile.controller.js'
import { getOrders, createOrder } from '../controllers/order.controller.js'
import { register, login, logout } from '../controllers/userAuth.controller.js'
import { validateRegister, validateLogin } from '../middlewares/userAuthValidation.js'
import isUser from '../middlewares/isUser.js'
import authenticate from '../../../middlewares/authenticate.js'

const router = Router()

// Public authentication routes
router.post('/register', validateRegister, register)
router.post('/login', validateLogin, login)
router.post('/logout', authenticate, logout)

// Public radicals list for learners
import { fetchRadicalsService } from '../../admin/services/radicalMgmt.service.js'
router.get('/radicals', async (req, res) => {
  try {
    const { search, strokeCount } = req.query
    const result = await fetchRadicalsService({
      page: 1,
      limit: 300,
      search: search || '',
      strokeCount: strokeCount || 'all'
    })
    res.json({
      success: true,
      radicals: result.radicals
    })
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải danh sách bộ thủ!' })
  }
})

// Public vocabulary list and details for learners
import { fetchVocabularyService, fetchVocabularyByIdService } from '../../admin/services/vocabMgmt.service.js'

router.get('/vocabularies', async (req, res) => {
  try {
    const { search, hskLevel, wordTypeId, topicId, radicalId, page, limit } = req.query
    const result = await fetchVocabularyService({
      search: search || '',
      hskLevel: hskLevel || '',
      wordTypeId: wordTypeId || '',
      topicId: topicId || '',
      radicalId: radicalId || '',
      isPublished: 'true', // Only show published words to learners
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    })
    res.json({
      success: true,
      ...result
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi tải danh sách từ vựng!' })
  }
})

router.get('/vocabularies/:id', async (req, res) => {
  try {
    const result = await fetchVocabularyByIdService(req.params.id)
    if (!result || !result.vocabulary.is_published) {
      return res.status(404).json({ message: 'Không tìm thấy từ vựng hoặc từ vựng chưa được xuất bản!' })
    }
    res.json({
      success: true,
      ...result
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi tải chi tiết từ vựng!' })
  }
})

// Apply isUser checking middleware for protected student/teacher routes
router.use(isUser)

router.get('/', (req, res) => {
  res.json({ message: 'User module base route' })
})

router.get('/profile', getProfile)
router.put('/profile', updateProfile)
router.get('/orders', getOrders)
router.post('/orders', createOrder)

export default router
