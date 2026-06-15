import jwt from 'jsonwebtoken'
import prisma from '../../prisma/client.js'

const ACCESS_TOKEN_EXPIRES_IN = '15m'
const REFRESH_TOKEN_EXPIRES_IN = '7d'
const REFRESH_TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000

export const generateTokens = (user) => {
  const payload = { id: user.id, username: user.username }

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  })

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  })

  return { accessToken, refreshToken }
}

// Replaces all of a user's refresh tokens with a single new one and returns it.
export const issueRefreshToken = async (user) => {
  const { accessToken, refreshToken } = generateTokens(user)

  await prisma.refreshToken.deleteMany({ where: { userId: user.id } })
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id },
  })

  return { accessToken, refreshToken }
}

export const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_LIFETIME_MS,
  })
}
