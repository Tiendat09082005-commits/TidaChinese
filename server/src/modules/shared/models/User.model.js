// Mock database structure for User
export class UserModel {
  constructor(data) {
    this.id = data.id
    this.username = data.username
    this.role = data.role || 'USER'
  }
}
