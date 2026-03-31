// src/hooks/useIngestFiles.js
// Papi — chunked file ingestion with progress tracking

import { useState, useCallback, useRef } from 'react'
import { kindOf, albumOf, isSupported } from '../utils/fileHelpers'

const CHUNK_SIZE = 80 // files processed per frame yield

// macOS hidden folders to exclude
const BLOCKED_FOLDERS = ['__MACOSX', '.Spotlight-V100', '.Trashes', '.fseventsd', '.TemporaryItems']

const isHiddenPath = (file) => {
  const parts = (file.webkitRelativePath || file.name).split('/')
  return parts.some(part =>
    part.startsWith('.') || BLOCKED_FOLDERS.includes(part)
  )
}

/**
 * @typedef {Object} MediaItem
 * @property {string} id      - Unique ID (index-based)
 * @property {File}   file
 * @property {string|null} url - Object URL, created lazily
 * @property {string} name
 * @property {number} size
 * @property {string} kind   - 'image' | 'video' | 'audio'
 * @property {string} album  - Derived from folder path
 */

/**
 * @returns {{
 *   media: MediaItem[],
 *   progress: { loading: boolean, current: number, total: number },
 *   ingest: (files: File[]) => void,
 *   getUrl: (item: MediaItem) => string,
 *   clear: () => void,
 * }}
 */
export function useIngestFiles() {
  const [media, setMedia]       = useState([])
  const [progress, setProgress] = useState({ loading: false, current: 0, total: 0 })

  // Keep a ref to current media for URL management without stale closures
  const mediaRef = useRef([])

  /** Lazily create and cache an object URL for a media item */
  const getUrl = useCallback((item) => {
    if (item.url) return item.url
    const url = URL.createObjectURL(item.file)
    // Mutate the ref directly — URL creation doesn't need a re-render
    const idx = mediaRef.current.findIndex(m => m.id === item.id)
    if (idx !== -1) mediaRef.current[idx].url = url
    return url
  }, [])

  /** Revoke all cached object URLs and reset state */
  const clear = useCallback(() => {
    mediaRef.current.forEach(m => { if (m.url) URL.revokeObjectURL(m.url) })
    mediaRef.current = []
    setMedia([])
    setProgress({ loading: false, current: 0, total: 0 })
  }, [])

  /** Ingest a FileList or File array, chunked to keep the UI responsive */
  const ingest = useCallback(async (files) => {
    const valid = files.filter(f => isSupported(f) && !isHiddenPath(f))
    if (!valid.length) return

    // Revoke previous URLs before replacing
    mediaRef.current.forEach(m => { if (m.url) URL.revokeObjectURL(m.url) })
    mediaRef.current = []

    setProgress({ loading: true, current: 0, total: valid.length })

    const result = []

    for (let i = 0; i < valid.length; i += CHUNK_SIZE) {
      const chunk = valid.slice(i, i + CHUNK_SIZE)

      chunk.forEach((file, j) => {
        result.push({
          id:           `${i + j}`,
          file,
          url:          null,
          name:         file.name,
          size:         file.size,
          lastModified: file.lastModified,
          kind:         kindOf(file),
          album:        albumOf(file),
        })
      })

      setProgress(prev => ({
        ...prev,
        current: Math.min(i + CHUNK_SIZE, valid.length),
      }))

      // Yield to browser between chunks to keep UI responsive
      await new Promise(r => setTimeout(r, 0))
    }

    mediaRef.current = result
    setMedia(result)
    setProgress({ loading: false, current: valid.length, total: valid.length })
  }, [])

  return { media, progress, ingest, getUrl, clear }
}