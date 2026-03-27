// src/hooks/useAlbums.js
// Papi — derive album groups from a flat media array

import { useMemo } from 'react'
import { sortMedia } from '../utils/fileHelpers'

/**
 * @param {import('./useIngestFiles').MediaItem[]} media
 * @param {string} activeAlbum  - album name or 'all'
 * @param {string} sortKey
 * @param {string} searchQuery  - lowercase search string
 *
 * @returns {{
 *   albums: Record<string, string[]>,  // albumName → item IDs
 *   filtered: MediaItem[],             // items for the active view
 *   grouped: Record<string, MediaItem[]>, // grouped for "all" view
 *   albumNames: string[],              // sorted album names (excl. 'all')
 * }}
 */
export function useAlbums(media, activeAlbum, sortKey, searchQuery) {

  // Build album → id map whenever media changes
  const albums = useMemo(() => {
    const map = { all: [] }
    media.forEach(item => {
      map.all.push(item.id)
      if (!map[item.album]) map[item.album] = []
      map[item.album].push(item.id)
    })
    return map
  }, [media])

  const albumNames = useMemo(() =>
    Object.keys(albums)
      .filter(k => k !== 'all')
      .sort((a, b) => a.localeCompare(b))
  , [albums])

  // Items for the active album, filtered by search, sorted
  const filtered = useMemo(() => {
    const ids = albums[activeAlbum] ?? []
    let items  = ids.map(id => media.find(m => m.id === id)).filter(Boolean)

    if (searchQuery) {
      items = items.filter(m => m.name.toLowerCase().includes(searchQuery))
    }

    return sortMedia(items, sortKey)
  }, [media, albums, activeAlbum, sortKey, searchQuery])

  // When viewing "all", group by album for section headers
  const grouped = useMemo(() => {
    if (activeAlbum !== 'all') return { [activeAlbum]: filtered }

    return filtered.reduce((acc, item) => {
      if (!acc[item.album]) acc[item.album] = []
      acc[item.album].push(item)
      return acc
    }, {})
  }, [activeAlbum, filtered])

  return { albums, filtered, grouped, albumNames }
}
