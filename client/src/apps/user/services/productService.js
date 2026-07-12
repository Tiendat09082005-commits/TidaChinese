import userApi from './userApi'

export const getProducts = () => userApi.get('/products')
export const getProductById = (id) => userApi.get(`/products/${id}`)
