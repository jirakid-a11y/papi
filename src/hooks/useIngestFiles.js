// src/hooks/useIngestFiles.js
// Papi — chunked file ingestion, perf-optimized

import { useState, useCallback, useRef } from 'react'
import { kindOf, albumOf, isSupported } from '../utils/fileHelpers'

const CHUNK_SIZE = 200 // increased from 80 — filter+map is cheap

const BLOCKED_SEGMENTS = [
  '__MACOSX', '.Spotlight-V100', '.Trashes',
  '.fseventsd', '.TemporaryItems', '.DS_Store',
]

const isHiddenPath = (file) => {
  const parts = (file.webkitRelativePath || file.name).split('/')
  return parts.some(p => p.startsWith('.') || BLOCKED_SEGMENTS.includes(p))
}

export function useIngestFiles() {
  const [media,    setMedia]    = useState([])
  const [progress, setProgress] = useState({ loading: false, current: 0, total: 0 })

  // Map of id → objectURL, managed here so we never double-create
  const urlCache = useRef(new Map())

  /** Get or create object URL — created once, cached forever until clear() */
  const getUrl = useCallback((item) => {
    if (urlCache.current.has(item.id)) return urlCache.current.get(item.id)
    const url = URL.createObjectURL(item.file)
    urlCache.current.set(item.id, url)
    return url
  }, [])

  const clear = useCallback(() => {
    urlCache.current.forEach(url => URL.revokeObjectURL(url))
    urlCache.current.clear()
    setMedia([])
    setProgress({ loading: false, current: 0, total: 0 })
  }, [])

  const ingest = useCallback(async (files) => {
    const valid = [...files].filter(f => isSupported(f) && !isHiddenPath(f))
    if (!valid.length) return

    // Revoke all previous URLs before replacing
    urlCache.current.forEach(url => URL.revokeObjectURL(url))
    urlCache.current.clear()

    setProgress({ loading: true, current: 0, total: valid.length })

    const result = []

    for (let i = 0; i < valid.length; i += CHUNK_SIZE) {
      const chunk = valid.slice(i, i + CHUNK_SIZE)

      for (let j = 0; j < chunk.length; j++) {
        const file = chunk[j]
        result.push({
          id:           String(i + j),
          file,
          name:         file.name,
          size:         file.size,
          lastModified: file.lastModified,
          kind:         kindOf(file),
          album:        albumOf(file),
        })
      }

      setProgress(prev => ({
        ...prev,
        current: Math.min(i + CHUNK_SIZE, valid.length),
      }))

      // Yield to browser between chunks
      await new Promise(r => setTimeout(r, 0))
    }

    setMedia(result)
    setProgress({ loading: false, current: valid.length, total: valid.length })
  }, [])

  return { media, progress, ingest, getUrl, clear }
}