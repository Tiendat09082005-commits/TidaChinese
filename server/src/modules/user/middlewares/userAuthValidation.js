export const validateRegister = (req, res, next) => {
  const { displayName, email, password } = req.body

  if (!displayName || !displayName.trim()) {
    return res.status(400).json({ message: 'Tên hiển thị không được để trống!' })
  }
  if (displayName.trim().length < 2 || displayName.trim().length > 100) {
    return res.status(400).json({ message: 'Tên hiển thị phải dài từ 2 đến 100 ký tự!' })
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ message: 'Email không được để trống!' })
  }
  if (!password || !password.trim()) {
    return res.status(400).json({ message: 'Mật khẩu không được để trống!' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ message: 'Email không đúng định dạng hợp lệ!' })
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải chứa ít nhất 6 ký tự!' })
  }

  next()
}

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body

  if (!email || !email.trim()) {
    return res.status(400).json({ message: 'Email không được để trống!' })
  }
  if (!password || !password.trim()) {
    return res.status(400).json({ message: 'Mật khẩu không được để trống!' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ message: 'Email không đúng định dạng hợp lệ!' })
  }

  next()
}
