import pool from '../../../config/db.js'
import bcrypt from 'bcryptjs'

// Helper to map role_id to string representation for FE consistency
const getRoleName = (roleId) => {
  switch (roleId) {
    case 1: return 'USER'
    case 2: return 'TEACHER'
    case 3: return 'ADMIN'
    case 4: return 'SUPERADMIN'
    default: return 'USER'
  }
}

// Fetch users by pagination, role type filter, and search
export const fetchUsersService = async ({ page, limit, search, roleType }) => {
  const offset = (page - 1) * limit

  let countQuery = 'SELECT COUNT(*) FROM users u WHERE 1=1'
  let selectQuery = `
    SELECT u.id, u.email, u.display_name, u.role_id, r.name as role, u.is_active, 
           u.hsk_goal_level, u.daily_goal_min, u.learning_goal, u.dialect_pref, 
           u.streak_days, u.last_login_at, u.created_at 
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE 1=1
  `
  const queryParams = []
  let paramIndex = 1

  // Filter by Tab (roleType)
  if (roleType === 'USER') {
    countQuery += ` AND u.role_id IN (1, 2)`
    selectQuery += ` AND u.role_id IN (1, 2)`
  } else {
    // Admin tab gets all administrative roles (ADMIN: 3, SUPERADMIN: 4)
    countQuery += ` AND u.role_id IN (3, 4)`
    selectQuery += ` AND u.role_id IN (3, 4)`
  }

  // Filter by Search Query (displayName or email)
  if (search) {
    countQuery += ` AND (u.display_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`
    selectQuery += ` AND (u.display_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`
    queryParams.push(`%${search}%`)
    paramIndex++
  }

  // Add Pagination
  selectQuery += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
  const selectParams = [...queryParams, limit, offset]

  const totalRes = await pool.query(countQuery, queryParams)
  const userRes = await pool.query(selectQuery, selectParams)

  // Map database uppercase role name standard
  const mappedUsers = userRes.rows.map(user => ({
    ...user,
    role: getRoleName(user.role_id)
  }))

  return {
    total: parseInt(totalRes.rows[0].count),
    users: mappedUsers
  }
}

// Find user by ID
export const findUserByIdService = async (id) => {
  const queryStr = `
    SELECT u.id, u.email, u.display_name, u.role_id, r.name as role, u.is_active, 
           u.hsk_goal_level, u.daily_goal_min, u.learning_goal, u.dialect_pref, 
           u.streak_days, u.last_login_at, u.created_at 
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.id = $1
  `
  const result = await pool.query(queryStr, [id])
  if (result.rows.length === 0) return null

  const user = result.rows[0]
  user.role = getRoleName(user.role_id)
  return user
}

// Create new user with hashed password
export const createUserService = async (userData) => {
  const { email, password, displayName, roleId, isActive, hskGoalLevel } = userData

  // Check duplicate email
  const checkDup = await pool.query('SELECT id FROM users WHERE email = $1', [
    email.trim().toLowerCase()
  ])
  if (checkDup.rows.length > 0) {
    throw { status: 400, message: 'Email này đã tồn tại trên hệ thống!' }
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10
  const salt = await bcrypt.genSalt(saltRounds)
  const passwordHash = await bcrypt.hash(password, salt)

  const insertQuery = `
    INSERT INTO users (email, password_hash, display_name, role_id, is_active, hsk_goal_level)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, email, display_name, role_id, is_active, hsk_goal_level, created_at
  `
  const result = await pool.query(insertQuery, [
    email.trim().toLowerCase(),
    passwordHash,
    displayName.trim(),
    roleId ? parseInt(roleId) : 1,
    isActive !== undefined ? isActive : true,
    hskGoalLevel ? parseInt(hskGoalLevel) : null
  ])

  const newUser = result.rows[0]
  newUser.role = getRoleName(newUser.role_id)
  return newUser
}

// Update user details
export const updateUserService = async (id, updateData) => {
  const { displayName, roleId, isActive, hskGoalLevel } = updateData

  const updateQuery = `
    UPDATE users
    SET display_name = $1, 
        role_id = $2, 
        is_active = $3, 
        hsk_goal_level = $4, 
        updated_at = NOW()
    WHERE id = $5
    RETURNING id, email, display_name, role_id, is_active, hsk_goal_level, created_at
  `
  const result = await pool.query(updateQuery, [
    displayName.trim(),
    parseInt(roleId),
    isActive,
    hskGoalLevel ? parseInt(hskGoalLevel) : null,
    id
  ])

  const updatedUser = result.rows[0]
  updatedUser.role = getRoleName(updatedUser.role_id)
  return updatedUser
}

// Delete user by ID (supports soft & hard delete modes)
export const deleteUserService = async (id, { mode, currentAdminId }) => {
  if (parseInt(id) === parseInt(currentAdminId)) {
    throw { status: 400, message: 'Bạn không thể tự khóa/xóa tài khoản của chính mình!' }
  }

  if (mode === 'hard') {
    // Delete session records first to avoid foreign key errors
    await pool.query('DELETE FROM user_sessions WHERE user_id = $1', [id])
    await pool.query('DELETE FROM users WHERE id = $1', [id])
    return { message: 'Đã xóa vĩnh viễn tài khoản người dùng ra khỏi hệ thống!' }
  } else {
    // Default: Soft Delete (is_active = false)
    await pool.query("UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1", [id])
    return { message: 'Đã khóa tạm thời tài khoản người dùng (Trạng thái chuyển sang Tạm khóa)!' }
  }
}
