import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

// Middlewares
import errorHandler from './middlewares/errorHandler.js'

// Routes
import adminRoutes from './modules/admin/routes/admin.routes.js'
import userRoutes from './modules/user/routes/user.routes.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Standard express middleware configurations
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Register application modules
app.use('/api/admin', adminRoutes)
app.use('/api/user', userRoutes)

// Healthcheck/test endpoint
app.get('/api', (req, res) => {
  res.json({ message: 'TidaChinese API Server is active' })
})

// Error handling middleware
app.use(errorHandler)

// Test DB Connection before starting server listener
import { testDbConnection } from './config/db.js'

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`)
  await testDbConnection()
})

export default app
