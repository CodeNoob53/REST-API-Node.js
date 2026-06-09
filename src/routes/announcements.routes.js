import { Router } from 'express'
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcements.controller.js'
import {
  getAnnouncementsValidator,
  getByIdValidator,
  createAnnouncementValidator,
  updateAnnouncementValidator,
  deleteAnnouncementValidator,
} from '../validators/announcements.validator.js'

const router = Router()

router.get('/', getAnnouncementsValidator, getAnnouncements)
router.get('/:id', getByIdValidator, getAnnouncementById)
router.post('/', createAnnouncementValidator, createAnnouncement)
router.patch('/:id', updateAnnouncementValidator, updateAnnouncement)
router.delete('/:id', deleteAnnouncementValidator, deleteAnnouncement)

export default router
