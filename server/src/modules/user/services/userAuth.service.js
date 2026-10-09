import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../../../config/db.js'
import { createSession, destroyAllUserSessions } from '../../shared/services/session.service.js'
const getRoleName = (roleId) => {
  switch (roleId) {
    case 1: return 'USER'
    case 2: return 'TEACHER'
    case 3: return 'ADMIN'
    case 4: return 'SUPERADMIN'
    default: return 'USER'
  }
}

// [POST] /api/user/register
export const registerUser = async ({ 
  displayName, 
  email, 
  password, 
  learningGoal, 
  hskGoalLevel, 
  dailyGoalMin, 
  dialectPref, 
  notifyTime, 
  darkMode,
  deviceInfo = null,
  ipAddress = null
}) => {
  // Check if email already exists
  const checkEmailQuery = 'SELECT id FROM users WHERE email = $1'
  const emailResult = await pool.query(checkEmailQuery, [email.trim().toLowerCase()])
  if (emailResult.rows.length > 0) {
    throw { status: 400, message: 'Email này đã được sử dụng bởi tài khoản khác!' }
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10
  const salt = await bcrypt.genSalt(saltRounds)
  const passwordHash = await bcrypt.hash(password, salt)

  // Insert user
  const insertQuery = `
    INSERT INTO users (
      email, password_hash, display_name, role_id, is_active,
      learning_goal, hsk_goal_level, daily_goal_min, dialect_pref, notify_time, dark_mode
    )
    VALUES ($1, $2, $3, 1, true, $4, $5, $6, $7, $8, $9)
    RETURNING id, email, display_name, role_id, avatar_url, learning_goal, hsk_goal_level, daily_goal_min, dialect_pref, notify_time, dark_mode
  `
  const insertResult = await pool.query(insertQuery, [
    email.trim().toLowerCase(),
    passwordHash,
    displayName.trim(),
    learningGoal || null,
    hskGoalLevel ? parseInt(hskGoalLevel) : null,
    dailyGoalMin ? parseInt(dailyGoalMin) : 15,
    dialectPref || 'beijing',
    notifyTime || null,
    darkMode || false
  ])

  
  const newUser = insertResult.rows[0]
  const roleName = getRoleName(newUser.role_id)

  // Generate Token (expires in 24h for users)
  const token = jwt.sign(
    { 
      id: newUser.id, 
      email: newUser.email, 
      role_id: newUser.role_id,
      role: roleName
    }, 
    process.env.JWT_SECRET || 'super_secret_key_123',
    { expiresIn: '24h' }
  )

  // Save session in DB
  const expiresMs = 24 * 60 * 60 * 1000 // 24 hours
  await createSession(newUser.id, token, deviceInfo, ipAddress, expiresMs)

  return { 
    user: {
      id: newUser.id,
      email: newUser.email,
      display_name: newUser.display_name,
      role_id: newUser.role_id,
      role: roleName,
      avatar_url: newUser.avatar_url,
      learning_goal: newUser.learning_goal,
      hsk_goal_level: newUser.hsk_goal_level,
      daily_goal_min: newUser.daily_goal_min,
      dialect_pref: newUser.dialect_pref,
      notify_time: newUser.notify_time,
      dark_mode: newUser.dark_mode
    }, 
    token 
  }
}

// [POST] /api/user/login
export const loginUser = async ({ email, password, deviceInfo = null, ipAddress = null }) => {
  const userQuery = 'SELECT * FROM users WHERE email = $1'
  const userResult = await pool.query(userQuery, [email.trim().toLowerCase()])

  if (userResult.rows.length === 0) {
    throw { status: 401, message: 'Email hoặc mật khẩu không chính xác!' }
  }

  const user = userResult.rows[0]

  if (!user.is_active) {
    throw { status: 403, message: 'Tài khoản của bạn đang bị khóa hoặc không hoạt động!' }
  }

  // User login: role_id must be 1 (user) or 2 (teacher)
  if (user.role_id !== 1 && user.role_id !== 2) {
    throw { status: 403, message: 'Tài khoản không hợp lệ để đăng nhập khu vực học viên!' }
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
    { expiresIn: '24h' }
  )
  // Destroy any existing sessions for this user to enforce single-session policy
  await destroyAllUserSessions(user.id)
  
  // Save session in DB
  const expiresMs = 24 * 60 * 60 * 1000 // 24 hours
  await createSession(user.id, token, deviceInfo, ipAddress, expiresMs)

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      role_id: user.role_id,
      role: roleName,
      avatar_url: user.avatar_url,
      learning_goal: user.learning_goal,
      hsk_goal_level: user.hsk_goal_level,
      daily_goal_min: user.daily_goal_min,
      dialect_pref: user.dialect_pref,
      notify_time: user.notify_time,
      dark_mode: user.dark_mode
    }
  }
}
