import axios from 'axios'

const userApi = axios.create({
  baseURL: '/api/user',
})

export default userApi
