import jwt from 'jsonwebtoken'
import { verifySession } from '../modules/shared/services/session.service.js'

export default async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Không tìm thấy mã xác thực. Vui lòng đăng nhập lại!' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_123')
    
    // Verify session status in database
    const isSessionActive = await verifySession(token)
    if (!isSessionActive) {
      return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn hoặc không tồn tại!' })
    }

    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Mã xác thực không hợp lệ hoặc đã hết hạn!' })
  }
}
