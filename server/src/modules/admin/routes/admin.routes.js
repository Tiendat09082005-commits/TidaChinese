import { Router } from 'express'
import { getDashboardData } from '../controllers/dashboard.controller.js'
import { getAllUsers, createUser, getUserById, updateUser, deleteUser } from '../controllers/userMgmt.controller.js'
import { getReports } from '../controllers/report.controller.js'
import { login } from '../controllers/adminAuth.controller.js'
import { validateLogin } from '../../user/middlewares/userAuthValidation.js'
import isAdmin from '../middlewares/isAdmin.js'
import { validateCreateUser, validateUpdateUser } from '../middlewares/userMgmt.validation.js'
import multer from 'multer'
import { uploadToCloudinary } from '../../shared/services/upload.service.js'

// Radicals Imports
import { 
  getAllRadicals, checkDuplicate, checkUsage, 
  createRadical, updateRadical, deleteRadical 
} from '../controllers/radicalMgmt.controller.js'
import { 
  validateCreateRadical, validateUpdateRadical 
} from '../middlewares/radicalMgmt.validation.js'

// Vocabulary Imports
import {
  getAllVocabularies, checkDuplicateHanzi, generateTts,
  createVocabulary, updateVocabulary, deleteVocabulary, getVocabUsage,
  bulkUpdateVocabularies, bulkDeleteVocabularies, getVocabularyById, importVocabularyCsv
} from '../controllers/vocabMgmt.controller.js'
import {
  validateCreateVocabulary, validateUpdateVocabulary
} from '../middlewares/vocabMgmt.validation.js'

const router = Router()

// Multer setup using memory storage to buffer files without disk write overhead
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept any audio or image format
    if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Định dạng tệp tin tải lên không hợp lệ! Hệ thống chỉ hỗ trợ tệp tin âm thanh (audio) và hình ảnh (image).'), false)
    }
  }
})

// Whitelist mapping of upload types to Cloudinary directories
const FOLDER_WHITELIST = {
  radicals: 'tida_chinese/radicals',
  avatar: 'tida_chinese/avatars',
  vocabulary: 'tida_chinese/vocabularies',
  lecture: 'tida_chinese/lectures'
}

// Public Auth routes for Admin
router.post('/login', validateLogin, login)

// Apply isAdmin checking middleware for protected management routes
router.use(isAdmin)

router.get('/', (req, res) => {
  res.json({ message: 'Admin module base route' })
})

router.get('/dashboard', getDashboardData)

// User Management Routes
router.get('/users', getAllUsers)
router.post('/users', validateCreateUser, createUser)
router.get('/users/:id', getUserById)
router.put('/users/:id', validateUpdateUser, updateUser)
router.delete('/users/:id', deleteUser)

// Radicals Management Routes
router.get('/radicals', getAllRadicals)
router.get('/radicals/check-duplicate', checkDuplicate)
router.get('/radicals/:id/usage', checkUsage)
router.post('/radicals', validateCreateRadical, createRadical)
router.put('/radicals/:id', validateUpdateRadical, updateRadical)
router.delete('/radicals/:id', deleteRadical)

// Media Asset Upload Endpoint with validation and Cloudinary integration
router.post('/media/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message })
    }
    next()
  })
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn tệp tin cần tải lên!' })
    }

    const { type } = req.query
    const folder = FOLDER_WHITELIST[type] || 'tida_chinese/misc'

    // Determine the resource_type based on mime type (audio -> video, image -> image)
    const resourceType = req.file.mimetype.startsWith('audio') ? 'video' : 'image'

    // Upload to Cloudinary using buffer
    const result = await uploadToCloudinary(req.file.buffer, folder, resourceType)

    res.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      message: 'Tải file đa phương tiện lên Cloudinary thành công!'
    })
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    res.status(500).json({ 
      message: error.message || 'Lỗi hệ thống khi tải file đa phương tiện lên Cloudinary!' 
    })
  }
})

// Vocabulary Management Routes
router.get('/vocabularies', getAllVocabularies)
router.get('/vocabularies/check-duplicate', checkDuplicateHanzi)
router.post('/vocabularies/generate-tts', generateTts)
router.post('/vocabularies/import-csv', upload.single('file'), importVocabularyCsv)
router.post('/vocabularies', validateCreateVocabulary, createVocabulary)
router.get('/vocabularies/:id', getVocabularyById)
router.get('/vocabularies/:id/usage', getVocabUsage)
router.put('/vocabularies/:id', validateUpdateVocabulary, updateVocabulary)
router.delete('/vocabularies/:id', deleteVocabulary)
router.post('/vocabularies/bulk-update', bulkUpdateVocabularies)
router.post('/vocabularies/bulk-delete', bulkDeleteVocabularies)

router.get('/reports', getReports)

export default router
