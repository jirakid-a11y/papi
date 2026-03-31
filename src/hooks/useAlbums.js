import { useMemo } from 'react'
import { sortMedia } from '../utils/fileHelpers'

function buildTree(media) {
  const root = { _files: [] }
  for (const item of media) {
    const rel = item.file.webkitRelativePath || item.name
    const parts = rel.split('/').filter(Boolean)
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

function getNode(tree, navPath) {
  let node = tree
  for (const seg of navPath) {
    if (!node[seg]) return { _files: [] }
    node = node[seg]
  }
  return node
}

function subFoldersOf(node) {
  return Object.keys(node).filter(k => k !== '_files').sort((a, b) => a.localeCompare(b))
}

function countAll(node) {
  let n = node._files.length
  for (const key of Object.keys(node)) {
    if (key !== '_files') n += countAll(node[key])
  }
  return n
}

// Build a flat list of tree items for the sidebar.
// Expands only the folders along navPath, keeping all siblings visible.
function buildTreeItems(node, depth, pathSoFar, navPath) {
  const items = []
  for (const name of subFoldersOf(node)) {
    const pathToThis = [...pathSoFar, name]
    const isExpanded = navPath[depth] === name
    const isActive   = isExpanded && navPath.length === depth + 1
    items.push({
      name,
      depth,
      isActive,
      isExpanded,
      count: countAll(node[name]),
      hasChildren: subFoldersOf(node[name]).length > 0,
      navPath: pathToThis,
    })
    if (isExpanded) {
      items.push(...buildTreeItems(node[name], depth + 1, pathToThis, navPath))
    }
  }
  return items
}

export function useAlbums(media, navPath, sortKey) {
  const tree        = useMemo(() => buildTree(media), [media])
  const currentNode = useMemo(() => getNode(tree, navPath), [tree, navPath])
  const subFolders  = useMemo(() => subFoldersOf(currentNode), [currentNode])
  const files       = useMemo(() => sortMedia([...currentNode._files], sortKey), [currentNode, sortKey])
  const sidebarFolders = useMemo(() =>
    subFolders.map(name => ({
      name,
      count: countAll(currentNode[name]),
      hasChildren: subFoldersOf(currentNode[name]).length > 0,
    }))
  , [subFolders, currentNode])
  const rootFolders = useMemo(() => subFoldersOf(tree), [tree])
  const treeItems   = useMemo(() => buildTreeItems(tree, 0, [], navPath), [tree, navPath])

  return { files, subFolders, sidebarFolders, rootFolders, treeItems }
}
