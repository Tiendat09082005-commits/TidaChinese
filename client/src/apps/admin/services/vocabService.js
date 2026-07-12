import adminApi from './userService'

export const getVocabularies = (params) => adminApi.get('/vocabularies', { params })

export const checkDuplicateVocab = (hanzi) => adminApi.get('/vocabularies/check-duplicate', { params: { hanzi } })

export const generateTtsAudio = (hanzi) => adminApi.post('/vocabularies/generate-tts', { hanzi })

export const getVocabUsage = (id) => adminApi.get(`/vocabularies/${id}/usage`)

export const createVocabulary = (data) => adminApi.post('/vocabularies', data)

export const updateVocabulary = (id, data) => adminApi.put(`/vocabularies/${id}`, data)

export const deleteVocabulary = (id) => adminApi.delete(`/vocabularies/${id}`)

export const bulkUpdateVocabularies = (ids, isPublished) => adminApi.post('/vocabularies/bulk-update', { ids, isPublished })

export const bulkDeleteVocabularies = (ids) => adminApi.post('/vocabularies/bulk-delete', { ids })

// Helper uploader
export const uploadMedia = (file, type) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  return adminApi.post(`/media/upload?type=${type}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
