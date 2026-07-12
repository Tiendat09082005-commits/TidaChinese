import crypto from 'crypto'
import pool from '../../../config/db.js'

// Hash token string using SHA-256
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Store a new session in user_sessions
export const createSession = async (userId, token, deviceInfo, ipAddress, expiresMs) => {
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + expiresMs)
  const insertSessionQuery = `
    INSERT INTO user_sessions (user_id, token_hash, device_info, ip_address, expires_at)
    VALUES ($1, $2, $3, $4, $5)
  `
  await pool.query(insertSessionQuery, [userId, tokenHash, deviceInfo, ipAddress, expiresAt])
}

// Delete a session upon logout
export const destroySession = async (token) => {
  if (!token) return
  const tokenHash = hashToken(token)
  const deleteSessionQuery = 'DELETE FROM user_sessions WHERE token_hash = $1'
  await pool.query(deleteSessionQuery, [tokenHash])
}

// Check if session is active and not expired in DB
export const verifySession = async (token) => {
  if (!token) return false
  const tokenHash = hashToken(token)
  const sessionQuery = 'SELECT id FROM user_sessions WHERE token_hash = $1 AND expires_at > NOW()'
  const result = await pool.query(sessionQuery, [tokenHash])
  return result.rows.length > 0
}
