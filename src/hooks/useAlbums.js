import { useMemo } from 'react'
import { sortMedia } from '../utils/fileHelpers'

// Build the folder tree from a flat media array.
// Each node: { _files: MediaItem[], _count: number, [folderName]: node }
// _count is pre-computed (total files recursively) so countAll is O(1).
function buildTree(media) {
  const root = { _files: [], _count: 0 }
  for (const item of media) {
    const rel = item.file.webkitRelativePath || item.name
    const parts = rel.split('/').filter(Boolean)
    let node = root
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i]
      if (!node[seg]) node[seg] = { _files: [], _count: 0 }
      node = node[seg]
    }
    node._files.push(item)
  }
  computeCounts(root)
  return root
}

// Post-order traversal: compute _count for every node bottom-up.
function computeCounts(node) {
  let n = node._files.length
  for (const key of Object.keys(node)) {
    if (key !== '_files' && key !== '_count') n += computeCounts(node[key])
  }
  return (node._count = n)
}

function getNode(tree, navPath) {
  let node = tree
  for (const seg of navPath) {
    if (!node[seg]) return { _files: [], _count: 0 }
    node = node[seg]
  }
  return node
}

function subFoldersOf(node) {
  const keys = []
  for (const key of Object.keys(node)) {
    if (key !== '_files' && key !== '_count') keys.push(key)
  }
  return keys.sort((a, b) => a.localeCompare(b))
}

// Flatten the tree into a sidebar-ready list, expanding only the active navPath.
function buildTreeItems(node, depth, pathSoFar, navPath) {
  const items = []
  for (const name of subFoldersOf(node)) {
    const pathToThis = [...pathSoFar, name]
    const isExpanded = navPath[depth] === name
    const isActive   = isExpanded && navPath.length === depth + 1
    const child      = node[name]
    items.push({
      name,
      depth,
      isActive,
      isExpanded,
      count:       child._count,
      hasChildren: subFoldersOf(child).length > 0,
      navPath:     pathToThis,
    })
    if (isExpanded) {
      items.push(...buildTreeItems(child, depth + 1, pathToThis, navPath))
    }
  }
  return items
}

export function useAlbums(media, navPath, sortKey) {
  const tree        = useMemo(() => buildTree(media), [media])
  const currentNode = useMemo(() => getNode(tree, navPath), [tree, navPath])
  const subFolders  = useMemo(() => subFoldersOf(currentNode), [currentNode])
  const files       = useMemo(() => sortMedia([...currentNode._files], sortKey), [currentNode, sortKey])

  // Per-subfolder metadata for the folder icon grid (O(subFolders.length), counts are O(1))
  const sidebarFolders = useMemo(() =>
    subFolders.map(name => ({
      name,
      count:       currentNode[name]._count,
      hasChildren: subFoldersOf(currentNode[name]).length > 0,
    }))
  , [subFolders, currentNode])

  const rootFolders = useMemo(() => subFoldersOf(tree), [tree])
  const treeItems   = useMemo(() => buildTreeItems(tree, 0, [], navPath), [tree, navPath])

  return { files, subFolders, sidebarFolders, rootFolders, treeItems }
}
