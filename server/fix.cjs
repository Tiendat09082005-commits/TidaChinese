const fs = require('fs');
const file = 'C:/Project/TidaChinese/server/src/modules/admin/services/userMgmt.service.js';
let lines = fs.readFileSync(file, 'utf8').split('\n');
const index = lines.findIndex(l => l.includes('export const bulkUpdateUsersService'));
if(index !== -1) {
  lines = lines.slice(0, index);
}
const fixedAppend = `
// Bulk update users
export const bulkUpdateUsersService = async (userIds, updateData) => {
  const { roleId, isActive } = updateData
  if (!userIds || userIds.length === 0) return { message: 'Không có người dùng nào được chọn!' }

  let query = 'UPDATE users SET updated_at = NOW()'
  const params = []
  let paramIndex = 1

  if (roleId !== undefined && roleId !== null) {
    query += ', role_id = $' + paramIndex
    params.push(parseInt(roleId))
    paramIndex++
  }
  if (isActive !== undefined && isActive !== null) {
    query += ', is_active = $' + paramIndex
    params.push(isActive)
    paramIndex++
  }

  query += ' WHERE id = ANY($' + paramIndex + ')'
  params.push(userIds)

  await pool.query(query, params)
  return { message: 'Cập nhật hàng loạt thành công!' }
}

// Bulk delete users
export const bulkDeleteUsersService = async (userIds, { mode, currentAdminId }) => {
  if (!userIds || userIds.length === 0) return { message: 'Không có người dùng nào được chọn!' }
  
  // Remove current admin from the list so they can't delete themselves
  const safeUserIds = userIds.filter(id => parseInt(id) !== parseInt(currentAdminId))
  if (safeUserIds.length === 0) return { message: 'Bạn không thể khóa/xóa chính mình!' }

  if (mode === 'hard') {
    await pool.query('DELETE FROM user_sessions WHERE user_id = ANY($1)', [safeUserIds])
    await pool.query('DELETE FROM users WHERE id = ANY($1)', [safeUserIds])
    return { message: 'Đã xóa vĩnh viễn các tài khoản được chọn!' }
  } else {
    await pool.query('UPDATE users SET is_active = false, updated_at = NOW() WHERE id = ANY($1)', [safeUserIds])
    return { message: 'Đã khóa hàng loạt các tài khoản được chọn!' }
  }
}
`;

fs.writeFileSync(file, lines.join('\n') + '\n' + fixedAppend, 'utf8');
