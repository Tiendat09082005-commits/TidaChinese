import { loginAdmin } from '../services/adminAuth.service.js'

export const login = async (req, res, next) => {
  const { email, password } = req.body
  const deviceInfo = req.headers['user-agent']
  const ipAddress = req.ip || req.headers['x-forwarded-for']

  try {
    const data = await loginAdmin({ email, password, deviceInfo, ipAddress })
    return res.status(200).json({
      token: data.token,
      user: data.user,
      message: 'Đăng nhập trang quản trị thành công!'
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message })
    }
    console.error('Lỗi admin login controller:', error)
    return res.status(500).json({ message: 'Có lỗi xảy ra trên hệ thống!' })
  }
}
