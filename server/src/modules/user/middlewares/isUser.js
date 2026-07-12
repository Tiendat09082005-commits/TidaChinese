import authenticate from '../../../middlewares/authenticate.js'

export default [
  authenticate,
  (req, res, next) => {
    // Check if the authenticated user is a standard user (role_id 1) or teacher (role_id 2)
    if (!req.user || (req.user.role_id !== 1 && req.user.role_id !== 2)) {
      return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Chỉ dành cho học viên và giáo viên!' })
    }
    next()
  }
]
