// src/pages/ViewerPage.jsx
import { useState, useCallback } from 'react'
import { useIngestFiles } from '../hooks/useIngestFiles'
import { useMediaTree, useAlbums } from '../hooks/useAlbums'
import Toolbar            from '../components/Toolbar'
import AlbumSidebar       from '../components/AlbumSidebar'
import ViewPane           from '../components/ViewPane'
import IngestionProgress  from '../components/IngestionProgress'

const FILE_LIMIT   = 5000
const GRID_DEFAULT = 160

export default function ViewerPage() {
  const { media, progress, ingest, getUrl } = useIngestFiles()

  const [sortKey,   setSortKey]   = useState('latest')
  const [gridSize,  setGridSize]  = useState(GRID_DEFAULT)
  const [splitMode, setSplitMode] = useState(false)
  const [navPathL,  setNavPathL]  = useState([])
  const [navPathR,  setNavPathR]  = useState([])

  // Build the tree once — passed as prop so ViewPane(s) don't rebuild it
  const tree     = useMediaTree(media)
  const hasMedia = tree._count > 0

  // Sidebar tracks the left (primary) pane's location
  const { treeItems, rootFolders } = useAlbums(tree, navPathL, sortKey)

  const handleIngest = useCallback((rawFiles) => {
    const valid = [...rawFiles].filter(f =>
      !f.name.startsWith('.') &&
      (f.type.startsWith('image/') || f.type.startsWith('video/') || f.type.startsWith('audio/'))
    )
    if (valid.length > FILE_LIMIT) {
      if (!window.confirm(`You're opening ${valid.length.toLocaleString()} files. Continue?`)) return
    }
    ingest(rawFiles)
    setNavPathL([])
    setNavPathR([])
  }, [ingest])

  const handleToggleSplit = useCallback(() => {
    setSplitMode(m => {
      if (!m) setNavPathR([])  // reset right pane when opening split
      return !m
    })
  }, [])

  return (
    <div className="h-screen flex flex-col bg-black text-gray-200 overflow-hidden">

      <Toolbar
        onOpenFolder={handleIngest}
        sortKey={sortKey}
        onSortChange={setSortKey}
        gridSize={gridSize}
        onGridSizeChange={setGridSize}
        splitMode={splitMode}
        onToggleSplit={handleToggleSplit}
        hasMedia={hasMedia}
      />

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar — fixed, always tracks left pane */}
        {hasMedia && treeItems.length > 0 && (
          <AlbumSidebar
            treeItems={treeItems}
            navPath={navPathL}
            onNavToPath={setNavPathL}
            rootFolders={rootFolders}
          />
        )}

        {/* Pane(s) */}
        <div className="flex flex-1 overflow-hidden">
          <ViewPane
            tree={tree}
            getUrl={getUrl}
            navPath={navPathL}
            setNavPath={setNavPathL}
            sortKey={sortKey}
            gridSize={gridSize}
            onIngest={handleIngest}
          />

          {splitMode && (
            <>
              <div className="w-px bg-zinc-700 flex-shrink-0" />
              <ViewPane
                tree={tree}
                getUrl={getUrl}
                navPath={navPathR}
                setNavPath={setNavPathR}
                sortKey={sortKey}
                gridSize={gridSize}
                onIngest={handleIngest}
              />
            </>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex-shrink-0 flex items-center justify-between
                      px-3 h-7 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-500">
        <span>
          {!hasMedia ? 'Ready — open a folder to begin' : `${media.length.toLocaleString()} files loaded`}
        </span>
        <span className="hidden sm:flex items-center gap-3">
          <span><kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">←→</kbd> navigate</span>
          <span><kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">Esc</kbd> close</span>
        </span>
      </div>

      {progress.loading && <IngestionProgress current={progress.current} total={progress.total} />}
    </div>
  )
}
