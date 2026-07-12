import adminApi from './userService'

export const getRadicals = (params) => adminApi.get('/radicals', { params })

export const checkDuplicateRadical = (hanzi) => adminApi.get('/radicals/check-duplicate', { params: { hanzi } })

export const getRadicalUsage = (id) => adminApi.get(`/radicals/${id}/usage`)

export const createRadical = (data) => adminApi.post('/radicals', data)

export const updateRadical = (id, data) => adminApi.put(`/radicals/${id}`, data)

export const deleteRadical = (id) => adminApi.delete(`/radicals/${id}`)

export const uploadMedia = (file, type) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  return adminApi.post(`/media/upload?type=${type}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
