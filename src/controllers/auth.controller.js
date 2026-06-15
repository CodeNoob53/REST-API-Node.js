import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import createHttpError from 'http-errors'
import prisma from '../../prisma/client.js'
import {
  issueRefreshToken,
  setRefreshTokenCookie,
} from '../services/auth.service.js'

const toPublicUser = (user) => ({
  id: user.id,
  username: user.username,
  name: user.name,
  createdAt: user.createdAt,
})

export const register = async (req, res) => {
  const { username, password, name } = req.body

  const existingUser = await prisma.user.findUnique({ where: { username } })
  if (existingUser) {
    throw createHttpError(409, 'User with this username already exists')
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { username, password: hashedPassword, name },
  })

  const { accessToken, refreshToken } = await issueRefreshToken(user)
  setRefreshTokenCookie(res, refreshToken)

  res.status(201).json({
    user: toPublicUser(user),
    accessToken,
    refreshToken,
  })
}

export const login = async (req, res) => {
  const { username, password } = req.body

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    throw createHttpError(401, 'Invalid credentials')
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    throw createHttpError(401, 'Invalid credentials')
  }

  const { accessToken, refreshToken } = await issueRefreshToken(user)
  setRefreshTokenCookie(res, refreshToken)

  res.json({
    user: toPublicUser(user),
    accessToken,
    refreshToken,
  })
}

export const refresh = async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken

  if (!token) {
    throw createHttpError(401, 'Refresh token not provided')
  }

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
  } catch (error) {
    throw createHttpError(401, 'Invalid or expired refresh token')
  }

  const storedToken = await prisma.refreshToken.findFirst({
    where: { token },
  })
  if (!storedToken) {
    throw createHttpError(401, 'Invalid or expired refresh token')
  }

  // Token rotation: remove the used token, issue a fresh pair.
  await prisma.refreshToken.delete({ where: { id: storedToken.id } })

  const user = { id: payload.id, username: payload.username }
  const { accessToken, refreshToken } = await issueRefreshToken(user)
  setRefreshTokenCookie(res, refreshToken)

  res.json({ accessToken, refreshToken })
}

export const logout = async (req, res) => {
  await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } })

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  })

  res.json({ message: 'Logged out successfully' })
}

export const me = async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.user.id },
  })
  res.json(toPublicUser(user))
}
