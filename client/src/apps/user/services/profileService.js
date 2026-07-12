import axios from 'axios'

// Get profile details for authenticated user
export const getProfile = () => {
  const token = localStorage.getItem('user_token')
  return axios.get('/api/user/profile', {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// Update profile details for authenticated user
export const updateProfile = (profileData) => {
  const token = localStorage.getItem('user_token')
  return axios.put('/api/user/profile', profileData, {
    headers: { Authorization: `Bearer ${token}` }
  })
}
