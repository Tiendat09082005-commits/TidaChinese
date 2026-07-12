import * as userService from '../services/userMgmt.service.js'

// GET /api/admin/users
export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const search = req.query.search || ''
    const roleType = req.query.roleType || 'USER'

    const { total, users } = await userService.fetchUsersService({ page, limit, search, roleType })

    res.json({
      success: true,
      total,
      page,
      limit,
      users
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/admin/users
export const createUser = async (req, res, next) => {
  try {
    const newUser = await userService.createUserService(req.body)
    res.status(201).json({
      success: true,
      message: 'Thêm tài khoản người dùng thành công!',
      user: newUser
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/admin/users/:id
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params
    const user = await userService.findUserByIdService(id)

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng!' })
    }

    res.json({
      success: true,
      user
    })
  } catch (err) {
    next(err)
  }
}

// PUT /api/admin/users/:id
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params
    
    // Check existence
    const user = await userService.findUserByIdService(id)
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng!' })
    }

    const updatedUser = await userService.updateUserService(id, req.body)

    res.json({
      success: true,
      message: 'Cập nhật tài khoản người dùng thành công!',
      user: updatedUser
    })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const { mode } = req.query
    const currentAdminId = req.user.id

    // Check existence
    const user = await userService.findUserByIdService(id)
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng!' })
    }

    const result = await userService.deleteUserService(id, { mode, currentAdminId })

    res.json({
      success: true,
      message: result.message
    })
  } catch (err) {
    next(err)
  }
}
