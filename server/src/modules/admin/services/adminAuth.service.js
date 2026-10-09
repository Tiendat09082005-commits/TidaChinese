import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../../../config/db.js'
import { createSession, destroyAllUserSessions } from '../../shared/services/session.service.js'
import { authenticator } from 'otplib'
import qrcode from 'qrcode'

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

// [POST] /api/admin/setup-2fa
export const generate2faSecret = async (tempToken) => {
  if (!tempToken) {
    throw { status: 401, message: 'Yêu cầu token xác thực hợp lệ!' }
  }

  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'super_secret_key_123')
  } catch (err) {
    throw { status: 401, message: 'Token đã hết hạn hoặc không hợp lệ!' }
  }

  const userId = decoded.id
  const email = decoded.email

  // Tạo khóa bí mật mới
  const secret = authenticator.generateSecret()

  // Kiểm tra xem user đã có record trong bảng admin_2fa chưa
  const checkQuery = 'SELECT id FROM admin_2fa WHERE user_id = $1'
  const checkResult = await pool.query(checkQuery, [userId])

  if (checkResult.rows.length > 0) {
    // Nếu có rồi thì update lại secret mới (và đảm bảo is_enabled = false)
    const updateQuery = 'UPDATE admin_2fa SET secret = $1, is_enabled = false WHERE user_id = $2'
    await pool.query(updateQuery, [secret, userId])
  } else {
    // Nếu chưa có thì tạo mới
    const insertQuery = 'INSERT INTO admin_2fa (user_id, secret, is_enabled) VALUES ($1, $2, false)'
    await pool.query(insertQuery, [userId, secret])
  }

  // Tạo URL theo chuẩn TOTP để Google Authenticator nhận diện
  const serviceName = 'TidaChinese Admin'
  const otpauthUrl = authenticator.keyuri(email, serviceName, secret)

  // Sinh mã QR dạng Base64 Image
  const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl)

  return {
    secret,
    qrCodeUrl: qrCodeDataUrl,
    message: 'Vui lòng sử dụng Google Authenticator để quét mã QR này.'
  }
}
