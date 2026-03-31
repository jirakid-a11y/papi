// src/hooks/useAlbums.js
// Papi — full-depth folder tree, preserves exact folder structure

import { useMemo } from 'react'
import { sortMedia } from '../utils/fileHelpers'

/**
 * Build a tree that preserves the FULL path including the root folder name.
 *
 * Example: "Cat Photo Folder/Thai cat/cat1.jpg"
 * → tree["Cat Photo Folder"]["Thai cat"]._files = [cat1, cat2, ...]
 *
 * Every node: { _files: [], SubFolder: { _files: [], ... }, ... }
 */
function buildTree(media) {
  const root = { _files: [] }

  for (const item of media) {
    const rel   = item.file.webkitRelativePath || item.name
    const parts = rel.split('/').filter(Boolean)

    // All segments except the last (filename) are folder segments
    const segments = parts.slice(0, -1)

    let node = root
    for (const seg of segments) {
      if (!node[seg]) node[seg] = { _files: [] }
      node = node[seg]
    }
    node._files.push(item)
  }

  return root
}

/** Walk the tree along navPath to get the current node */
function getNode(tree, navPath) {
  let node = tree
  for (const seg of navPath) {
    if (!node[seg]) return { _files: [] }
    node = node[seg]
  }
  return node
}

/** Sub-folder names (exclude _files key), sorted */
function subFoldersOf(node) {
  return Object.keys(node)
    .filter(k => k !== '_files')
    .sort((a, b) => a.localeCompare(b))
}

/** Recursively count all files under a node */
function countAll(node) {
  let n = node._files.length
  for (const key of Object.keys(node)) {
    if (key !== '_files') n += countAll(node[key])
  }
  return n
}

export function useAlbums(media, navPath, sortKey) {
  // Rebuild tree only when media changes
  const tree = useMemo(() => buildTree(media), [media])

  // Current node at navPath depth
  const currentNode = useMemo(
    () => getNode(tree, navPath),
    [tree, navPath]
  )

  // Sub-folders at current level
  const subFolders = useMemo(
    () => subFoldersOf(currentNode),
    [currentNode]
  )

  // Files directly in this node, sorted
  const files = useMemo(
    () => sortMedia([...currentNode._files], sortKey),
    [currentNode, sortKey]
  )

  // Sidebar entries — sub-folders of current node with counts + child indicator
  const sidebarFolders = useMemo(() =>
    subFolders.map(name => ({
      name,
      count:       countAll(currentNode[name]),
      hasChildren: subFoldersOf(currentNode[name]).length > 0,
    }))
  , [subFolders, currentNode])

  // Top-level folder names (children of root) — used for sidebar root label
  const rootFolders = useMemo(() => subFoldersOf(tree), [tree])

  return { files, subFolders, sidebarFolders, rootFolders }
}