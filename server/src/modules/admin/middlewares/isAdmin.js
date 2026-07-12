import authenticate from '../../../middlewares/authenticate.js'

export default [
  authenticate,
  (req, res, next) => {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN')) {
      return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Chỉ dành cho Quản trị viên!' })
    }
    next()
  }
]

