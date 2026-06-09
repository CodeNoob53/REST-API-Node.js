import prisma from '../../prisma/client.js'

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
  const announcement = await prisma.announcement.create({ data: req.body })
  res.status(201).json(announcement)
}

export const updateAnnouncement = async (req, res) => {
  const announcement = await prisma.announcement.update({
    where: { id: Number(req.params.id) },
    data: req.body,
  })
  res.json(announcement)
}

export const deleteAnnouncement = async (req, res) => {
  await prisma.announcement.delete({
    where: { id: Number(req.params.id) },
  })
  res.status(204).end()
}
