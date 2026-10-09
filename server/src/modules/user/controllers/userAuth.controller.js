import { registerUser, loginUser } from '../services/userAuth.service.js'
import { destroySession } from '../../shared/services/session.service.js'

export const login = async (req, res, next) => {
  const { email, password } = req.body
  const deviceInfo = req.headers['user-agent']
  const ipAddress = req.ip || req.headers['x-forwarded-for']
  console.log(ipAddress);

  try {
    const data = await loginUser({ email, password, deviceInfo, ipAddress })
    return res.status(200).json({
      token: data.token,
      user: data.user,
      message: 'Đăng nhập thành công!'
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message })
    }
    console.error('Lỗi user login controller:', error)
    return res.status(500).json({ message: 'Có lỗi xảy ra trên hệ thống!' })
  }
}

export const register = async (req, res, next) => {
  const { 
    displayName, 
    email, 
    password, 
    learningGoal, 
    hskGoalLevel, 
    dailyGoalMin, 
    dialectPref, 
    notifyTime, 
    darkMode 
  } = req.body
  
  const deviceInfo = req.headers['user-agent']
  const ipAddress = req.ip || req.headers['x-forwarded-for']

  try {
    const data = await registerUser({ 
      displayName, 
      email, 
      password, 
      learningGoal, 
      hskGoalLevel, 
      dailyGoalMin, 
      dialectPref, 
      notifyTime, 
      darkMode,
      deviceInfo,
      ipAddress
    })
    return res.status(201).json({
      token: data.token,
      user: data.user,
      message: 'Đăng ký tài khoản mới thành công!'
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message })
    }
    console.error('Lỗi user register controller:', error)
    return res.status(500).json({ message: 'Có lỗi xảy ra trên hệ thống!' })
  }
}

export const logout = async (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  try {
    await destroySession(token)
    return res.status(200).json({ message: 'Đăng xuất tài khoản thành công!' })
  } catch (error) {
    console.error('Lỗi user logout controller:', error)
    return res.status(500).json({ message: 'Có lỗi xảy ra khi đăng xuất!' })
  }
}
