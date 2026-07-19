// src/hooks/useIngestFiles.js
// Papi — chunked file ingestion with progress tracking

import { useState, useCallback, useRef } from 'react'
import { kindOf, albumOf, isSupported } from '../utils/fileHelpers'

const CHUNK_SIZE = 1000 // files processed per frame yield — larger = faster ingest

// macOS hidden folders to exclude
const BLOCKED_FOLDERS = new Set(['__MACOSX', '.Spotlight-V100', '.Trashes', '.fseventsd', '.TemporaryItems'])

const isHiddenPath = (file) => {
  const parts = (file.webkitRelativePath || file.name).split('/')
  return parts.some(part => part.startsWith('.') || BLOCKED_FOLDERS.has(part))
}

/**
 * @typedef {Object} MediaItem
 * @property {string} id
 * @property {File}   file
 * @property {string|null} url  - Object URL, created lazily
 * @property {string} name
 * @property {number} size
 * @property {number} lastModified
 * @property {string} kind       - 'image' | 'video' | 'audio'
 * @property {string} album
 */

export function useIngestFiles() {
  const [media, setMedia]       = useState([])
  const [progress, setProgress] = useState({ loading: false, current: 0, total: 0 })
  const mediaRef = useRef([])

  /**
   * Lazily create and cache an object URL.
   * O(1) — mutates item.url directly since item is the same object in both
   * state and mediaRef (no array search needed).
   */
  const getUrl = useCallback((item) => {
    if (item.url) return item.url
    const url = URL.createObjectURL(item.file)
    item.url = url  // safe direct mutation — same object reference as in state
    return url
  }, [])

  const clear = useCallback(() => {
    mediaRef.current.forEach(m => { if (m.url) URL.revokeObjectURL(m.url) })
    mediaRef.current = []
    setMedia([])
    setProgress({ loading: false, current: 0, total: 0 })
  }, [])

  const ingest = useCallback(async (files) => {
    const valid = Array.from(files).filter(f => isSupported(f) && !isHiddenPath(f))
    if (!valid.length) return

    // Revoke previous object URLs before replacing
    mediaRef.current.forEach(m => { if (m.url) URL.revokeObjectURL(m.url) })
    mediaRef.current = []

    setProgress({ loading: true, current: 0, total: valid.length })

    const result = []
    for (let i = 0; i < valid.length; i += CHUNK_SIZE) {
      const chunk = valid.slice(i, i + CHUNK_SIZE)
      for (let j = 0; j < chunk.length; j++) {
        const file = chunk[j]
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
      }
      setProgress(prev => ({ ...prev, current: Math.min(i + CHUNK_SIZE, valid.length) }))
      await new Promise(r => setTimeout(r, 0))  // yield to browser
    }

    mediaRef.current = result
    setMedia(result)
    setProgress({ loading: false, current: valid.length, total: valid.length })
  }, [])

  return { media, progress, ingest, getUrl, clear }
}
