import adminApi from './adminApi'

export const getUsers = () => adminApi.get('/users')
export const createUser = (data) => adminApi.post('/users', data)
export const updateUser = (id, data) => adminApi.put(`/users/${id}`, data)
export const deleteUser = (id) => adminApi.delete(`/users/${id}`)
