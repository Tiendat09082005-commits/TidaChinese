import userApi from './userApi'

export const getOrders = () => userApi.get('/orders')
export const createOrder = (data) => userApi.post('/orders', data)
