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

  const roleName = getRoleName(user.role_id)
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role_id: user.role_id,
      role: roleName
    }, 
    process.env.JWT_SECRET || 'super_secret_key_123',
    { expiresIn: '2h' } // 2 hours
  )

  // Xóa tất cả các session cũ để đảm bảo Admin Single Session
  await destroyAllUserSessions(user.id)

  // Save session in DB
  const expiresMs = 2 * 60 * 60 * 1000 // 2 hours
  await createSession(user.id, token, deviceInfo, ipAddress, expiresMs)

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      role_id: user.role_id,
      role: roleName,
      avatar_url: user.avatar_url
    }
  }
}
