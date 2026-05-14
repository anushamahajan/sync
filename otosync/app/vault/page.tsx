'use client'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, X, Star } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useVault, useStarredItems } from '@/hooks/useVault'
import { useFolders } from '@/hooks/useFolders'
import { Sidebar } from '@/components/Sidebar'
import { BottomNav } from '@/components/BottomNav'
import { FeedCard, FeedCardSkeleton } from '@/components/FeedCard'
import { CaptureModal } from '@/components/CaptureModal'
import { ItemDetailModal } from '@/components/ItemDetailModal'
import { MoveFolderModal } from '@/components/MoveFolderModal'
import { NewFolderModal } from '@/components/NewFolderModal'
import { ToastContainer, useToast } from '@/components/Toast'
import type { Item } from '@/types'

type TypeFilter = 'all' | 'text' | 'image' | 'file' | 'link' | 'drive_link' | 'video_link'
const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'text', label: 'Text' },
  { id: 'image', label: 'Image' },
  { id: 'file', label: 'File' },
  { id: 'link', label: 'Link' },
  { id: 'drive_link', label: 'Drive' },
  { id: 'video_link', label: 'Video' },
]

export default function VaultPage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { items, loading, hasMore, loadMore, deleteItem, toggleStar, moveToFolder } = useVault()
  const { folders, loading: foldersLoading, createFolder } = useFolders()
  const { toasts, addToast, dismiss } = useToast()

  // Refresh the router cache once on mount so a post-auth redirect
  // always gets fresh data rather than a stale static render.
  useEffect(() => { router.refresh() }, [])

  const [showCapture, setShowCapture] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [moveItem, setMoveItem] = useState<Item | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  const filtered = useMemo(() => {
    let result = items
    if (typeFilter !== 'all') result = result.filter((i) => i.type === typeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((i) =>
        i.content?.toLowerCase().includes(q) ||
        i.ai_description?.toLowerCase().includes(q) ||
        i.file_name?.toLowerCase().includes(q) ||
        i.link_title?.toLowerCase().includes(q) ||
        i.drive_file_title?.toLowerCase().includes(q) ||
        i.link_url?.toLowerCase().includes(q)
      )
    }
    return result
  }, [items, typeFilter, search])

  async function handleMove(folderId: string | null) {
    if (!moveItem) return
    await moveToFolder(moveItem.id, folderId)
    const folderName = folders.find((f) => f.id === folderId)?.name
    addToast(folderName ? `Moved to "${folderName}"` : 'Removed from folder', 'success')
    setMoveItem(null)
  }

  async function handleCreateFolder(name: string, description: string, color: string) {
    await createFolder(name, description, color)
    addToast(`Folder "${name}" created`, 'success')
  }

  async function handleDelete(id: string) {
    await deleteItem(id)
    addToast('Item deleted', 'info')
    if (selectedItem?.id === id) setSelectedItem(null)
  }

  async function handleToggleStar(id: string, current: boolean) {
    await toggleStar(id, current)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar
        folders={folders}
        onNewFolder={() => setShowNewFolder(true)}
        onSignOut={signOut}
        userEmail={user?.email}
      />

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-[#e5e7eb] bg-white shrink-0">
          <span className="text-base font-bold text-[#111111] md:hidden">Sync</span>

          {/* Search */}
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your vault…"
              className="w-full pl-9 pr-8 py-2 text-sm bg-[#f4f4f4] rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#0891b2] transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888]">
                <X size={13} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowCapture(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0891b2] hover:bg-[#0e7490] text-white rounded-xl text-sm font-semibold transition-colors shrink-0"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Capture</span>
          </button>
        </header>

        {/* Type filters */}
        <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto border-b border-[#e5e7eb] scrollbar-hide">
          {TYPE_FILTERS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTypeFilter(id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                typeFilter === id
                  ? 'bg-[#111111] text-white'
                  : 'bg-[#f4f4f4] text-[#333333] hover:bg-[#e9ecef]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Feed */}
        <main className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="space-y-3">
              <FeedCardSkeleton />
              <FeedCardSkeleton />
              <FeedCardSkeleton />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState search={search} typeFilter={typeFilter} onCapture={() => setShowCapture(true)} />
          ) : (
            <div className="space-y-3 max-w-3xl">
              {filtered.map((item) => (
                <FeedCard
                  key={item.id}
                  item={item}
                  folders={folders}
                  onDelete={handleDelete}
                  onToggleStar={handleToggleStar}
                  onMove={setMoveItem}
                  onOpen={setSelectedItem}
                />
              ))}

              {hasMore && !search && typeFilter === 'all' && (
                <button
                  onClick={loadMore}
                  className="w-full py-3 text-sm text-[#888888] hover:text-[#333333] transition-colors"
                >
                  Load more
                </button>
              )}

              {search && (
                <p className="text-xs text-[#888888] text-center pt-2">
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </main>
      </div>

      <BottomNav />

      {showCapture && (
        <CaptureModal
          onClose={() => setShowCapture(false)}
          folders={folders}
          onSaved={(item) => {
            if (item.type !== 'text') addToast('Saved!', 'success')
          }}
        />
      )}

      {showNewFolder && (
        <NewFolderModal
          onClose={() => setShowNewFolder(false)}
          onCreate={handleCreateFolder}
        />
      )}

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          folders={folders}
          onClose={() => setSelectedItem(null)}
          onDelete={handleDelete}
          onToggleStar={handleToggleStar}
          onMove={(item) => { setMoveItem(item); setSelectedItem(null) }}
        />
      )}

      {moveItem && (
        <MoveFolderModal
          folders={folders}
          currentFolderId={moveItem.folder_id}
          onClose={() => setMoveItem(null)}
          onMove={handleMove}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

function EmptyState({ search, typeFilter, onCapture }: { search: string; typeFilter: string; onCapture: () => void }) {
  if (search) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-[#888888]">No results for "<strong>{search}</strong>"</p>
        <p className="text-xs text-[#888888] mt-1">Try different keywords</p>
      </div>
    )
  }
  if (typeFilter !== 'all') {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-[#888888]">No {typeFilter} items yet</p>
      </div>
    )
  }
  return (
    <div className="text-center py-20">
      <div className="w-14 h-14 bg-[#f4f4f4] rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Star size={24} className="text-[#888888]" />
      </div>
      <p className="text-base font-medium text-[#333333] mb-2">Your vault is empty</p>
      <p className="text-sm text-[#888888] mb-6">Save your first item to get started</p>
      <button
        onClick={onCapture}
        className="px-5 py-2.5 bg-[#0891b2] hover:bg-[#0e7490] text-white rounded-xl text-sm font-medium transition-colors"
      >
        + Capture something
      </button>
    </div>
  )
}
