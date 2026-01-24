/**
 * Compress an image file before upload
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width in pixels (default: 1200)
 * @param {number} maxHeight - Maximum height in pixels (default: 1200)
 * @param {number} quality - JPEG quality 0-1 (default: 0.8)
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = async (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'))
              return
            }

            // Create a new File object from the blob
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })

            resolve(compressedFile)
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
  })
}

/**
 * Check if compression is needed based on file size
 * @param {File} file - The image file
 * @param {number} maxSizeKB - Maximum file size in KB (default: 500)
 * @returns {boolean}
 */
export const needsCompression = (file, maxSizeKB = 500) => {
  return file.size > maxSizeKB * 1024
}

/**
 * Compress image if needed, otherwise return original
 * @param {File} file - The image file
 * @returns {Promise<File>}
 */
export const smartCompress = async (file) => {
  if (!file.type.startsWith('image/')) {
    return file
  }

  // If file is already small, don't compress
  if (!needsCompression(file)) {
    return file
  }

  try {
    const compressed = await compressImage(file)
    // Only use compressed version if it's actually smaller
    return compressed.size < file.size ? compressed : file
  } catch (error) {
    console.error('Compression failed, using original:', error)
    return file
  }
}
