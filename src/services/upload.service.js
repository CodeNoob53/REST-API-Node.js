import fs from 'fs/promises'
import cloudinary from '../config/cloudinary.js'
import logger from '../logger.js'

// Uploads a multer file to Cloudinary and removes the local temp file.
// Returns the secure URL of the uploaded image.
export const uploadImage = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'announcements',
    })
    logger.info({ url: result.secure_url }, 'Photo uploaded to Cloudinary')
    return result.secure_url
  } finally {
    await fs.unlink(file.path).catch(() => {})
  }
}
