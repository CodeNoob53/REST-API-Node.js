import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import pinoHttp from 'pino-http'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'
import { errors as celebrateErrors } from 'celebrate'
import logger from './src/logger.js'
import announcementsRouter from './src/routes/announcements.routes.js'
import authRouter from './src/routes/auth.routes.js'

const app = express()

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'REST API',
      version: '1.0.0',
      description: 'REST API documentation',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)

// CORS must come first so preflight OPTIONS gets the right headers
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
)

app.use(helmet())

app.use(pinoHttp({ logger }))

app.use(express.json())
app.use(cookieParser())

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/auth', authRouter)
app.use('/announcements', announcementsRouter)

app.use(celebrateErrors())

// 404 Not Found handler - must be after all routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err)

  // JSON parsing errors (invalid JSON format)
  if (err.type === 'entity.parse.failed' && err.status === 400) {
    return res.status(400).json({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid JSON',
      validation: {
        body: {
          source: 'body',
          keys: [],
          message: 'Invalid JSON format in request body',
        },
      },
    })
  }

  // http-errors (createHttpError) — e.g. 401, 409 from auth
  if (err.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.message })
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Resource not found' })
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Unique constraint violation' })
  }

  if (err.code === 'P2003') {
    return res.status(400).json({ error: 'Foreign key constraint failed' })
  }

  res.status(500).json({ error: 'Internal server error' })
})


const PORT = process.env.PORT || 3000

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`)
    logger.info(`API docs: http://localhost:${PORT}/api-docs`)
  })
}

export default app
