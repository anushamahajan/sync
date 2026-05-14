'use client'

export const dynamic = 'force-dynamic'

import { useState, useMemo, use, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Search, X, Sparkles, MessageSquare } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useVault } from '@/hooks/useVault'
import { useFolders } from '@/hooks/useFolders'
import { FeedCard, FeedCardSkeleton } from '@/components/FeedCard'
import { FolderChat } from '@/components/FolderChat'
import { CaptureModal } from '@/components/CaptureModal'
import { ItemDetailModal } from '@/components/ItemDetailModal'
import { MoveFolderModal } from '@/components/MoveFolderModal'
import { NewFolderModal } from '@/components/NewFolderModal'
import { Sidebar } from '@/components/Sidebar'
import { BottomNav } from '@/components/BottomNav'
import { ToastContainer, useToast } from '@/components/Toast'
import type { Item } from '@/types'

type Tab = 'items' | 'chat'

export default function FolderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, signOut } = useAuth()
  const { items, loading, deleteItem, toggleStar, moveToFolder } = useVault(id)
  const { folders, createFolder } = useFolders()
  const { toasts, addToast, dismiss } = useToast()

  const [tab, setTab] = useState<Tab>('items')
  const [showCapture, setShowCapture] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [moveItem, setMoveItem] = useState<Item | null>(null)
  const [search, setSearch] = useState('')

  // Keep selectedItem in sync with live item updates
  useEffect(() => {
    if (!selectedItem) return
    const updated = items.find((i) => i.id === selectedItem.id)
    if (updated) setSelectedItem(updated)
  }, [items])

  const folder = folders.find((f) => f.id === id)

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter((i) =>
      i.content?.toLowerCase().includes(q) ||
      i.ai_description?.toLowerCase().includes(q) ||
      i.file_name?.toLowerCase().includes(q) ||
      i.link_title?.toLowerCase().includes(q)
    )
  }, [items, search])

  async function handleMove(folderId: string | null) {
    if (!moveItem) return
    await moveToFolder(moveItem.id, folderId)
    const folderName = folders.find((f) => f.id === folderId)?.name
    addToast(folderName ? `Moved to "${folderName}"` : 'Removed from folder', 'success')
    setMoveItem(null)
  }

  async function handleDelete(itemId: string) {
    await deleteItem(itemId)
    addToast('Item deleted', 'info')
    if (selectedItem?.id === itemId) setSelectedItem(null)
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
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-[#e5e7eb] bg-white shrink-0">
          <Link href="/vault" className="text-[#888888] hover:text-[#111111] transition-colors">
            <ArrowLeft size={18} />
          </Link>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            {folder && (
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: folder.color }} />
            )}
            <h1 className="text-base font-semibold truncate">{folder?.name ?? 'Folder'}</h1>
            <span className="text-xs text-[#888888] shrink-0 bg-[#f4f4f4] px-2 py-0.5 rounded-full">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
          </div>

          <button
            onClick={() => setShowCapture(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0891b2] hover:bg-[#0e7490] text-white rounded-xl text-sm font-medium transition-colors shrink-0"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </header>

        {/* Tab bar */}
        <div className="flex border-b border-[#e5e7eb] px-4 shrink-0">
          <TabButton active={tab === 'items'} onClick={() => setTab('items')}>
            Items
          </TabButton>
          <TabButton active={tab === 'chat'} onClick={() => setTab('chat')}>
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} />
              Chat with AI
            </span>
          </TabButton>
        </div>

        {/* Content */}
        {tab === 'items' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="px-4 py-2.5 border-b border-[#e5e7eb] shrink-0">
              <div className="relative max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search in folder…"
                  className="w-full pl-8 pr-7 py-2 text-sm bg-[#f4f4f4] rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#0891b2] transition-all"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888]">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            <main className="flex-1 overflow-y-auto px-4 py-4">
              {loading ? (
                <div className="space-y-3">
                  <FeedCardSkeleton />
                  <FeedCardSkeleton />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  {search ? (
                    <p className="text-sm text-[#888888]">No results for "<strong>{search}</strong>"</p>
                  ) : (
                    <>
                      <p className="text-sm text-[#333333] font-medium mb-2">No items in this folder yet</p>
                      <p className="text-xs text-[#888888] mb-6">Add items or move them from your vault</p>
                      <button
                        onClick={() => setShowCapture(true)}
                        className="px-5 py-2.5 bg-[#0891b2] hover:bg-[#0e7490] text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        + Add item
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-w-3xl">
                  {filtered.map((item) => (
                    <FeedCard
                      key={item.id}
                      item={item}
                      folders={folders}
                      onDelete={handleDelete}
                      onToggleStar={toggleStar}
                      onMove={setMoveItem}
                      onOpen={setSelectedItem}
                    />
                  ))}

                  {/* AI chat CTA at bottom of items list */}
                  {items.length > 0 && (
                    <button
                      onClick={() => setTab('chat')}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[#bae6fd] bg-[#f0f9ff] hover:bg-[#e0f2fe] text-[#0891b2] text-sm font-medium transition-colors mt-2"
                    >
                      <MessageSquare size={15} />
                      Chat with AI about these {items.length} items →
                    </button>
                  )}
                </div>
              )}
            </main>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <FolderChat
              folderName={folder?.name ?? 'this folder'}
              items={items}
            />
          </div>
        )}
      </div>

      <BottomNav />

      {showCapture && (
        <CaptureModal
          onClose={() => setShowCapture(false)}
          folders={folders}
          onSaved={() => {}}
        />
      )}

      {showNewFolder && (
        <NewFolderModal
          onClose={() => setShowNewFolder(false)}
          onCreate={async (name, desc, color) => {
            await createFolder(name, desc, color)
            addToast(`Folder "${name}" created`, 'success')
          }}
        />
      )}

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          folders={folders}
          onClose={() => setSelectedItem(null)}
          onDelete={handleDelete}
          onToggleStar={toggleStar}
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

function TabButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
        active
          ? 'border-[#0891b2] text-[#0891b2]'
          : 'border-transparent text-[#888888] hover:text-[#333333]'
      }`}
    >
      {children}
    </button>
  )
}
