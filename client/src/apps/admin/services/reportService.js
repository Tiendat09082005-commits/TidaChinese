import adminApi from './adminApi'

export const getReports = () => adminApi.get('/reports')
export const getDashboardStats = () => adminApi.get('/dashboard-stats')
