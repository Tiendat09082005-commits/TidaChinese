export const getOrders = (req, res, next) => {
  res.json({ orders: [] })
}

export const createOrder = (req, res, next) => {
  res.json({ message: 'Order created' })
}
