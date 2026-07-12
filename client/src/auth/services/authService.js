import axios from 'axios'

// User (Student/Teacher) Auth Requests
export const login = (credentials) => axios.post('/api/user/login', credentials)
export const register = (userData) => axios.post('/api/user/register', userData)
export const logout = () => {
  const token = localStorage.getItem('user_token')
  return axios.post('/api/user/logout', null, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// Admin Auth Requests
export const adminLogin = (credentials) => axios.post('/api/admin/login', credentials)
export const adminLogout = () => {
  const token = localStorage.getItem('admin_token')
  return axios.post('/api/user/logout', null, {
    headers: { Authorization: `Bearer ${token}` }
  })
}
