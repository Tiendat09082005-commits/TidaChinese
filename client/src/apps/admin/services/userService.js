import axios from 'axios'

const adminApi = axios.create({
  baseURL: '/api/admin',
})

// Attach admin token automatically to every request
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

export const getUsers = (params) => adminApi.get('/users', { params })
export const getUserById = (id) => adminApi.get(`/users/${id}`)
export const createUser = (data) => adminApi.post('/users', data)
export const updateUser = (id, data) => adminApi.put(`/users/${id}`, data)
export const deleteUser = (id, params) => adminApi.delete(`/users/${id}`, { params })

export default adminApi
