import { fetchProfileData, updateProfileData } from '../services/profile.service.js'

export const getProfile = async (req, res, next) => {
  const userId = req.user.id

  try {
    const profile = await fetchProfileData(userId)
    return res.status(200).json({
      profile,
      message: 'Lấy thông tin tài khoản thành công!'
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message })
    }
    console.error('Lỗi getProfile controller:', error)
    return res.status(500).json({ message: 'Có lỗi xảy ra trên hệ thống khi lấy thông tin!' })
  }
}

export const updateProfile = async (req, res, next) => {
  const userId = req.user.id
  const {
    displayName,
    avatarUrl,
    hskGoalLevel,
    dailyGoalMin,
    learningGoal,
    dialectPref,
    fontSize,
    darkMode,
    notifyTime
  } = req.body

  try {
    const updatedProfile = await updateProfileData(userId, {
      displayName,
      avatarUrl,
      hskGoalLevel,
      dailyGoalMin,
      learningGoal,
      dialectPref,
      fontSize,
      darkMode,
      notifyTime
    })

    return res.status(200).json({
      profile: updatedProfile,
      message: 'Cập nhật thông tin tài khoản thành công!'
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message })
    }
    console.error('Lỗi updateProfile controller:', error)
    return res.status(500).json({ message: 'Có lỗi xảy ra khi cập nhật thông tin!' })
  }
}
