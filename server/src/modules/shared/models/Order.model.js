// Mock database structure for Order
export class OrderModel {
  constructor(data) {
    this.id = data.id
    this.userId = data.userId
    this.items = data.items || []
    this.total = data.total || 0
  }
}
