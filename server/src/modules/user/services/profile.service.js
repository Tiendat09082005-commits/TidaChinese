import pool from '../../../config/db.js'

// Helper to map role_id to string representation for FE
const getRoleName = (roleId) => {
  switch (roleId) {
    case 1: return 'USER'
    case 2: return 'TEACHER'
    case 3: return 'ADMIN'
    case 4: return 'SUPERADMIN'
    default: return 'USER'
  }
}

// Fetch user profile data from DB (excluding password)
export const fetchProfileData = async (userId) => {
  const query = `
    SELECT id, email, display_name, role_id, avatar_url, hsk_goal_level, 
           daily_goal_min, learning_goal, dialect_pref, font_size, 
           dark_mode, notify_time, streak_days, streak_last_at, 
           is_active, last_login_at, created_at, updated_at
    FROM users
    WHERE id = $1
  `
  const result = await pool.query(query, [userId])
  if (result.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy thông tin người dùng!' }
  }

  const user = result.rows[0]
  user.role = getRoleName(user.role_id)
  return user
}

// Update user configuration and settings in DB
export const updateProfileData = async (userId, {
  displayName,
  avatarUrl,
  hskGoalLevel,
  dailyGoalMin,
  learningGoal,
  dialectPref,
  fontSize,
  darkMode,
  notifyTime
}) => {
  // Check if user exists
  const checkQuery = 'SELECT id FROM users WHERE id = $1'
  const checkResult = await pool.query(checkQuery, [userId])
  if (checkResult.rows.length === 0) {
    throw { status: 404, message: 'Người dùng không tồn tại!' }
  }

  const updateQuery = `
    UPDATE users
    SET display_name = COALESCE($2, display_name),
        avatar_url = COALESCE($3, avatar_url),
        hsk_goal_level = COALESCE($4, hsk_goal_level),
        daily_goal_min = COALESCE($5, daily_goal_min),
        learning_goal = COALESCE($6, learning_goal),
        dialect_pref = COALESCE($7, dialect_pref),
        font_size = COALESCE($8, font_size),
        dark_mode = COALESCE($9, dark_mode),
        notify_time = COALESCE($10, notify_time),
        updated_at = NOW()
    WHERE id = $1
    RETURNING id, email, display_name, role_id, avatar_url, hsk_goal_level, 
              daily_goal_min, learning_goal, dialect_pref, font_size, 
              dark_mode, notify_time, streak_days, is_active, created_at, updated_at
  `
  const result = await pool.query(updateQuery, [
    userId,
    displayName ? displayName.trim() : null,
    avatarUrl || null,
    hskGoalLevel ? parseInt(hskGoalLevel) : null,
    dailyGoalMin ? parseInt(dailyGoalMin) : null,
    learningGoal || null,
    dialectPref || null,
    fontSize ? parseInt(fontSize) : null,
    darkMode !== undefined ? darkMode : null,
    notifyTime || null
  ])

  const updatedUser = result.rows[0]
  updatedUser.role = getRoleName(updatedUser.role_id)
  return updatedUser
}
