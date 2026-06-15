import createHttpError from 'http-errors'
import prisma from '../../prisma/client.js'
import logger from '../logger.js'
import { uploadImage } from '../services/upload.service.js'

const PER_PAGE = 10

export const getAnnouncements = async (req, res) => {
  const { search, sort } = req.query
  const page = Number(req.query.page) || 1

  const where = {}
  if (search) {
    where.title = { contains: search }
  }

  const orderBy = sort === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' }

  const [data, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy,
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.announcement.count({ where }),
  ])

  res.json({
    data,
    pagination: {
      total,
      page,
      totalPages: Math.ceil(total / PER_PAGE),
      perPage: PER_PAGE,
    },
  })
}

export const getAnnouncementById = async (req, res) => {
  const announcement = await prisma.announcement.findUniqueOrThrow({
    where: { id: Number(req.params.id) },
  })
  res.json(announcement)
}

export const createAnnouncement = async (req, res) => {
  const data = { ...req.body, userId: req.user.id }

  if (req.file) {
    data.imageUrl = await uploadImage(req.file)
  }

  const announcement = await prisma.announcement.create({ data })
  logger.info(
    { announcementId: announcement.id, userId: req.user.id },
    'Announcement created',
  )
  res.status(201).json(announcement)
}

export const updateAnnouncement = async (req, res) => {
  const id = Number(req.params.id)

  const existing = await prisma.announcement.findUniqueOrThrow({ where: { id } })
  if (existing.userId !== req.user.id) {
    throw createHttpError(403, 'Access denied')
  }

  const data = { ...req.body }
  if (req.file) {
    data.imageUrl = await uploadImage(req.file)
  }

  const announcement = await prisma.announcement.update({ where: { id }, data })
  logger.info({ announcementId: id, userId: req.user.id }, 'Announcement updated')
  res.json(announcement)
}

export const deleteAnnouncement = async (req, res) => {
  const id = Number(req.params.id)

  const existing = await prisma.announcement.findUniqueOrThrow({ where: { id } })
  if (existing.userId !== req.user.id) {
    throw createHttpError(403, 'Access denied')
  }

  await prisma.announcement.delete({ where: { id } })
  res.status(204).end()
}
