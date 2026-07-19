// src/hooks/useThumbnails.js
// Papi — shared thumbnail store built to stay flat under very large folders
// (10k+ files) without overloading CPU or memory.
//
// Two safeguards make it scale:
//   1. Bounded, cancellable work queue. Cards enqueue on mount and cancel() on
//      unmount, so a fast fling-scroll through thousands of items never floods
//      the worker pool with jobs for tiles that are already gone — the queue
//      only ever holds what is currently near the viewport.
//   2. LRU-capped cache. At most MAX_CACHE thumbnails are kept alive; the least
//      recently used are revoked as new ones arrive, so memory stays flat no
//      matter how many files you scroll past. Visible tiles are always "recently
//      requested", so they are never the ones evicted.
//
// The store is created ONCE (in ViewerPage) and shared by every pane.

import { useState, useEffect } from 'react'

const THUMB_W   = 400
const MAX_POOL  = 4
const MAX_CACHE = 1200   // ~1200 x ~12KB ≈ 14MB ceiling, well above any viewport

function createThumbnailManager() {
  const cache       = new Map()   // id -> objectURL, iteration order = LRU (oldest first)
  const queue       = []          // pending image jobs: { id, file }
  const queued      = new Set()   // ids waiting in `queue`
  const inFlight    = new Set()   // ids dispatched to a worker
  const idleWorkers = []          // workers ready for a job
  const listeners   = new Map()   // id -> Set<cb(url|undefined)>
  let   workers     = null        // lazily created pool

  const notify = (id, url) => {
    const set = listeners.get(id)
    if (set) set.forEach(cb => cb(url))
  }

  // Drop least-recently-used thumbnails once over the cap.
  const evict = () => {
    while (cache.size > MAX_CACHE) {
      const oldest = cache.keys().next().value
      URL.revokeObjectURL(cache.get(oldest))
      cache.delete(oldest)
      notify(oldest, undefined)   // no-op unless a card is still mounted (it isn't, if it's the oldest)
    }
  }

  // Store a generated thumbnail (from the worker for images, or MediaCard for
  // video posters) as the newest cache entry and wake subscribed cards.
  const put = (id, blob) => {
    const prev = cache.get(id)
    if (prev) { URL.revokeObjectURL(prev); cache.delete(id) }
    cache.set(id, URL.createObjectURL(blob))   // insert at the "newest" end
    inFlight.delete(id)
    evict()
    notify(id, cache.get(id))
  }

  const pump = () => {
    while (idleWorkers.length && queue.length) {
      const job = queue.shift()
      queued.delete(job.id)
      if (cache.has(job.id)) continue        // became available while queued
      inFlight.add(job.id)
      idleWorkers.pop().postMessage({ id: job.id, file: job.file, maxW: THUMB_W })
    }
  }

  const ensureWorkers = () => {
    if (workers) return
    workers = []
    const n = Math.min(MAX_POOL, Math.max(1, (navigator.hardwareConcurrency || 4) - 1))
    for (let i = 0; i < n; i++) {
      const w = new Worker(new URL('../workers/thumbWorker.js', import.meta.url), { type: 'module' })
      w.onmessage = (e) => {
        const { id, blob } = e.data
        inFlight.delete(id)
        if (blob) put(id, blob)
        else notify(id, undefined)   // unsupported/failed — leave uncached, may retry on remount
        idleWorkers.push(w)
        pump()
      }
      workers.push(w)
      idleWorkers.push(w)
    }
  }

  return {
    get: (id) => cache.get(id),

    subscribe: (id, cb) => {
      let set = listeners.get(id)
      if (!set) { set = new Set(); listeners.set(id, set) }
      set.add(cb)
      return () => { set.delete(cb); if (!set.size) listeners.delete(id) }
    },

    put,  // video posters funnel through here too

    // Queue an image thumbnail. Cheap/idempotent: cached hit just bumps LRU.
    requestImage: (item) => {
      const id = item.id
      if (cache.has(id)) {                    // touch → move to newest end so it survives eviction
        const url = cache.get(id)
        cache.delete(id); cache.set(id, url)
        return
      }
      if (inFlight.has(id) || queued.has(id)) return
      ensureWorkers()
      queued.add(id)
      queue.push({ id, file: item.file })
      pump()
    },

    // Called when a card unmounts (scrolled away). Removes it from the queue if
    // it hasn't started yet — this is what keeps the queue bounded during flings.
    // In-flight jobs (≤ pool size) are left to finish.
    cancel: (id) => {
      if (!queued.has(id)) return
      queued.delete(id)
      const i = queue.findIndex(j => j.id === id)
      if (i >= 0) queue.splice(i, 1)
    },

    // Reset for a new ingest (ids are reused per folder open).
    clear: () => {
      cache.forEach(url => URL.revokeObjectURL(url))
      cache.clear()
      queue.length = 0
      queued.clear()
      inFlight.clear()
      listeners.forEach(set => set.forEach(cb => cb(undefined)))
    },

    destroy: () => {
      cache.forEach(url => URL.revokeObjectURL(url))
      cache.clear()
      if (workers) workers.forEach(w => w.terminate())
    },
  }
}

export function useThumbnails() {
  const [manager] = useState(createThumbnailManager)   // created once, stable
  useEffect(() => () => manager.destroy(), [manager])
  return manager
}
