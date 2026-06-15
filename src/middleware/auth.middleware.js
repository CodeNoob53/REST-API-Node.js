import jwt from 'jsonwebtoken'
import createHttpError from 'http-errors'

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    throw createHttpError(401, 'Invalid or expired token')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    throw createHttpError(401, 'Invalid or expired token')
  }
}
