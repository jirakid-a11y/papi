// src/utils/fileHelpers.js
// Papi — shared file utility functions

/**
 * Format raw bytes into human-readable string
 * @param {number} bytes
 * @returns {string} e.g. "2.4 MB"
 */
export const fmtSize = (bytes) => {
  if (bytes < 1024)        return bytes + ' B'
  if (bytes < 1_048_576)   return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1_073_741_824) return (bytes / 1_048_576).toFixed(2) + ' MB'
  return (bytes / 1_073_741_824).toFixed(2) + ' GB'
}

/**
 * Determine media kind from MIME type
 * @param {File} file
 * @returns {'image' | 'video' | 'audio' | 'unknown'}
 */
export const kindOf = (file) => {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  return 'unknown'
}

/**
 * Extract uppercased file extension
 * @param {string} name  e.g. "photo.jpg"
 * @returns {string}     e.g. "JPG"
 */
export const extOf = (name) =>
  (name.split('.').pop() ?? '').toUpperCase()

/**
 * Extract album name from webkitRelativePath.
 * e.g. "Vacation/Beach/IMG_001.jpg" → "Beach"
 *      "IMG_001.jpg"                → "Unsorted"
 * @param {File} file
 * @returns {string}
 */
export const albumOf = (file) => {
  const rel   = file.webkitRelativePath || ''
  const parts = rel.split('/')
  if (parts.length > 2) return parts[parts.length - 2]
  if (parts.length === 2) return parts[0]
  return 'Unsorted'
}

/**
 * Check if a file is a supported media type
 * @param {File} file
 * @returns {boolean}
 */
export const isSupported = (file) => {
  if (file.name.startsWith('.')) return false   // skip macOS metadata files (._*, .DS_Store, etc.)
  return (
    file.type.startsWith('image/') ||
    file.type.startsWith('video/') ||
    file.type.startsWith('audio/')
  )
}

/**
 * Sort an array of media items by a sort key
 * @param {Array}  items
 * @param {string} sortKey  'name-asc' | 'name-desc' | 'size-asc' | 'size-desc' | 'type'
 * @returns {Array} new sorted array
 */
// Sorts in-place — callers must pass a copy if the original must be preserved.
export const sortMedia = (items, sortKey) => {
  switch (sortKey) {
    case 'latest':    return items.sort((a, b) => b.lastModified - a.lastModified)
    case 'oldest':    return items.sort((a, b) => a.lastModified - b.lastModified)
    case 'name-asc':  return items.sort((a, b) => a.name.localeCompare(b.name))
    case 'name-desc': return items.sort((a, b) => b.name.localeCompare(a.name))
    case 'size-asc':  return items.sort((a, b) => a.size - b.size)
    case 'size-desc': return items.sort((a, b) => b.size - a.size)
    case 'type':      return items.sort((a, b) => a.kind.localeCompare(b.kind))
    default:          return items
  }
}