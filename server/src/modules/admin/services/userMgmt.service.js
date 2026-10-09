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
export const fetchUsersService = async ({ page, limit, search, roleType, exactRole, isActive }) => {
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
  let roleCondition = ''
  if (roleType === 'USER') {
    roleCondition = ` AND u.role_id IN (1, 2)`
  } else {
    // Admin tab gets all administrative roles (ADMIN: 3, SUPERADMIN: 4)
    roleCondition = ` AND u.role_id IN (3, 4)`
  }
  
  // Specific role filter
  if (exactRole && exactRole !== 'ALL') {
    roleCondition += ` AND u.role_id = $${paramIndex}`
    queryParams.push(parseInt(exactRole))
    paramIndex++
  }
  
  countQuery += roleCondition
  selectQuery += roleCondition

  // Status filter
  if (isActive && isActive !== 'ALL') {
    const isActiveBool = isActive === 'true'
    countQuery += ` AND u.is_active = $${paramIndex}`
    selectQuery += ` AND u.is_active = $${paramIndex}`
    queryParams.push(isActiveBool)
    paramIndex++
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

  // Stats query
  const statsQuery = `
    SELECT 
      COUNT(*) as total_users,
      SUM(CASE WHEN role_id = 1 THEN 1 ELSE 0 END) as total_students,
      SUM(CASE WHEN role_id = 2 THEN 1 ELSE 0 END) as total_teachers,
      SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as total_active
    FROM users
    WHERE 1=1 ${roleType === 'USER' ? 'AND role_id IN (1, 2)' : 'AND role_id IN (3, 4)'}
  `
  const statsRes = await pool.query(statsQuery)
  const stats = {
    total: parseInt(statsRes.rows[0].total_users || 0),
    students: parseInt(statsRes.rows[0].total_students || 0),
    teachers: parseInt(statsRes.rows[0].total_teachers || 0),
    active: parseInt(statsRes.rows[0].total_active || 0)
  }

  return {
    total: parseInt(totalRes.rows[0].count),
    users: mappedUsers,
    stats
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
    throw { status: 400, message: 'Email nÃ y Ä‘Ã£ tá»“n táº¡i trÃªn há»‡ thá»‘ng!' }
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
    throw { status: 400, message: 'Báº¡n khÃ´ng thá»ƒ tá»± khÃ³a/xÃ³a tÃ i khoáº£n cá»§a chÃ­nh mÃ¬nh!' }
  }

  if (mode === 'hard') {
    // Delete session records first to avoid foreign key errors
    await pool.query('DELETE FROM user_sessions WHERE user_id = $1', [id])
    await pool.query('DELETE FROM users WHERE id = $1', [id])
    return { message: 'ÄÃ£ xÃ³a vÄ©nh viá»…n tÃ i khoáº£n ngÆ°á»i dÃ¹ng ra khá»i há»‡ thá»‘ng!' }
  } else {
    // Default: Soft Delete (is_active = false)
    await pool.query("UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1", [id])
    return { message: 'ÄÃ£ khÃ³a táº¡m thá»i tÃ i khoáº£n ngÆ°á»i dÃ¹ng (Tráº¡ng thÃ¡i chuyá»ƒn sang Táº¡m khÃ³a)!' }
  }
}

// Bulk update users

// Bulk update users

// Bulk update users
export const bulkUpdateUsersService = async (userIds, updateData) => {
  const { roleId, isActive } = updateData
  if (!userIds || userIds.length === 0) return { message: 'Không có người dùng nào được chọn!' }

  let query = 'UPDATE users SET updated_at = NOW()'
  const params = []
  let paramIndex = 1

  if (roleId !== undefined && roleId !== null) {
    query += ', role_id = $' + paramIndex
    params.push(parseInt(roleId))
    paramIndex++
  }
  if (isActive !== undefined && isActive !== null) {
    query += ', is_active = $' + paramIndex
    params.push(isActive)
    paramIndex++
  }

  query += ' WHERE id = ANY($' + paramIndex + ')'
  params.push(userIds)

  await pool.query(query, params)
  return { message: 'Cập nhật hàng loạt thành công!' }
}

// Bulk delete users
export const bulkDeleteUsersService = async (userIds, { mode, currentAdminId }) => {
  if (!userIds || userIds.length === 0) return { message: 'Không có người dùng nào được chọn!' }
  
  // Remove current admin from the list so they can't delete themselves
  const safeUserIds = userIds.filter(id => parseInt(id) !== parseInt(currentAdminId))
  if (safeUserIds.length === 0) return { message: 'Bạn không thể khóa/xóa chính mình!' }

  if (mode === 'hard') {
    await pool.query('DELETE FROM user_sessions WHERE user_id = ANY($1)', [safeUserIds])
    await pool.query('DELETE FROM users WHERE id = ANY($1)', [safeUserIds])
    return { message: 'Đã xóa vĩnh viễn các tài khoản được chọn!' }
  } else {
    await pool.query('UPDATE users SET is_active = false, updated_at = NOW() WHERE id = ANY($1)', [safeUserIds])
    return { message: 'Đã khóa hàng loạt các tài khoản được chọn!' }
  }
}
