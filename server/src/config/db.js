import pg from 'pg'
import dotenv from 'dotenv'

// Load environments
dotenv.config()

const { Pool } = pg

// Configure pool to connect using the DB_URL connection string (typically used by Neon)
const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: process.env.DB_URL && process.env.DB_URL.includes('neon.tech') 
    ? { rejectUnauthorized: false } 
    : false,
  max: 10,
  idleTimeoutMillis: 15000,      // Giải phóng kết nối rỗi sau 15 giây
  connectionTimeoutMillis: 10000 // Chờ tối đa 10 giây cho Cold Start
})

// Tự động dọn dẹp các kết nối chết khi xảy ra lỗi ngầm trên client rỗi
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle PostgreSQL client in pool:', err.message)
})

export const query = (text, params) => pool.query(text, params)

export const testDbConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()')
    console.log('💚 [SUCCESS] Kết nối Database Neon (PostgreSQL) thành công!')
    console.log(`🕒 Thời gian phản hồi từ DB: ${res.rows[0].now}`)
    return true
  } catch (err) {
    console.error('💔 [ERROR] Kết nối Database Neon (PostgreSQL) thất bại!')
    console.error(`Chi tiết lỗi: ${err.message}`)
    return false
  }
}

export default pool
