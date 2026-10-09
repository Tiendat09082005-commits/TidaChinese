import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../../../config/db.js'
import { createSession, destroyAllUserSessions } from '../../shared/services/session.service.js'

const getRoleName = (roleId) => {
  switch (roleId) {
    case 3: return 'ADMIN'
    case 4: return 'SUPERADMIN'
    default: return 'ADMIN'
  }
}

// [POST] /api/admin/login
export const loginAdmin = async ({ email, password, deviceInfo = null, ipAddress = null }) => {
  const userQuery = 'SELECT * FROM users WHERE email = $1'
  const userResult = await pool.query(userQuery, [email.trim().toLowerCase()])

  if (userResult.rows.length === 0) {
    throw { status: 401, message: 'Email hoặc mật khẩu không chính xác!' }
  }

  const user = userResult.rows[0]

  if (!user.is_active) {
    throw { status: 403, message: 'Tài khoản của bạn đang bị khóa hoặc không hoạt động!' }
  }

  // Admin login: role_id must be 3 (admin) or 4 (superadmin)
  if (user.role_id !== 3 && user.role_id !== 4) {
    throw { status: 403, message: 'Tài khoản của bạn không có quyền truy cập trang quản trị!' }
  }

  const isMatch = await bcrypt.compare(password, user.password_hash)
  if (!isMatch) {
    throw { status: 401, message: 'Email hoặc mật khẩu không chính xác!' }
  }

  // Update last login
  const updateLoginQuery = 'UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1'
  await pool.query(updateLoginQuery, [user.id])

  // Check 2FA status
  const tfaQuery = 'SELECT is_enabled FROM admin_2fa WHERE user_id = $1'
  const tfaResult = await pool.query(tfaQuery, [user.id])
  const isEnabled = tfaResult.rows.length > 0 && tfaResult.rows[0].is_enabled

  // Create temp token for 2FA flow (valid for 5 mins)
  const tempToken = jwt.sign(
    { 
      id: user.id,
      email: user.email,
      role_id: user.role_id,
      deviceInfo,
      ipAddress
    }, 
    process.env.JWT_SECRET || 'super_secret_key_123',
    { expiresIn: '5m' }
  )

  if (!isEnabled) {
    return {
      status: 'REQUIRE_SETUP',
      temp_token: tempToken,
      message: 'Tài khoản chưa cài đặt bảo mật 2 lớp. Yêu cầu thiết lập.'
    }
  }

  return {
    status: 'REQUIRE_VERIFY',
    temp_token: tempToken,
    message: 'Yêu cầu xác thực mã 2FA.'
  }
}
