import axios from 'axios'

const adminApi = axios.create({
  baseURL: '/api/admin',
})

export default adminApi
