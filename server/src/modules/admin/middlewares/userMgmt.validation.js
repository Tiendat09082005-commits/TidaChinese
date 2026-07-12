// Middleware validations for admin creating and updating users (aligned with PostgreSQL schema)

export const validateCreateUser = (req, res, next) => {
  const { email, password, displayName, roleId, isActive, hskGoalLevel } = req.body

  if (!email || !password || !displayName) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ các trường bắt buộc (*)' })
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ message: 'Địa chỉ Email sai định dạng!' })
  }

  // Password length
  if (password.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải chứa ít nhất 6 ký tự!' })
  }

  // Role validation: 1 to 4
  const validRoleIds = [1, 2, 3, 4]
  if (roleId !== undefined && !validRoleIds.includes(parseInt(roleId))) {
    return res.status(400).json({ message: 'Vai trò phân quyền không hợp lệ!' })
  }

  // HSK Goal Level validation
  if (hskGoalLevel !== undefined && (parseInt(hskGoalLevel) < 1 || parseInt(hskGoalLevel) > 6)) {
    return res.status(400).json({ message: 'Trình độ HSK mục tiêu từ HSK 1 đến HSK 6!' })
  }

  next()
}

export const validateUpdateUser = (req, res, next) => {
  const { displayName, roleId, isActive, hskGoalLevel } = req.body

  if (!displayName || !displayName.trim()) {
    return res.status(400).json({ message: 'Tên hiển thị không được để trống!' })
  }

  // Role validation: 1 to 4
  const validRoleIds = [1, 2, 3, 4]
  if (roleId !== undefined && !validRoleIds.includes(parseInt(roleId))) {
    return res.status(400).json({ message: 'Vai trò phân quyền không hợp lệ!' })
  }

  // Status validation: boolean
  if (isActive === undefined) {
    return res.status(400).json({ message: 'Vui lòng xác định trạng thái hoạt động!' })
  }

  // HSK Goal Level validation
  if (hskGoalLevel !== undefined && hskGoalLevel !== null && (parseInt(hskGoalLevel) < 1 || parseInt(hskGoalLevel) > 6)) {
    return res.status(400).json({ message: 'Trình độ HSK mục tiêu từ HSK 1 đến HSK 6!' })
  }

  next()
}
