'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStarredItems } from '@/hooks/useVault'
import { useFolders } from '@/hooks/useFolders'
import { FeedCard, FeedCardSkeleton } from '@/components/FeedCard'
import { ItemDetailModal } from '@/components/ItemDetailModal'
import { MoveFolderModal } from '@/components/MoveFolderModal'
import { NewFolderModal } from '@/components/NewFolderModal'
import { Sidebar } from '@/components/Sidebar'
import { BottomNav } from '@/components/BottomNav'
import { ToastContainer, useToast } from '@/components/Toast'
import { createClient } from '@/lib/supabase/client'
import type { Item } from '@/types'

export default function StarredPage() {
  const { user, signOut } = useAuth()
  const { items, loading } = useStarredItems()
  const { folders, createFolder } = useFolders()
  const { toasts, addToast, dismiss } = useToast()
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [moveItem, setMoveItem] = useState<Item | null>(null)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const supabase = createClient()

  async function handleDelete(id: string) {
    await supabase.from('items').delete().eq('id', id)
    addToast('Item deleted', 'info')
    if (selectedItem?.id === id) setSelectedItem(null)
  }

  async function handleToggleStar(id: string, current: boolean) {
    await supabase.from('items').update({ is_starred: !current }).eq('id', id)
  }

  async function handleMove(folderId: string | null) {
    if (!moveItem) return
    await supabase.from('items').update({ folder_id: folderId }).eq('id', moveItem.id)
    const folderName = folders.find((f) => f.id === folderId)?.name
    addToast(folderName ? `Moved to "${folderName}"` : 'Removed from folder', 'success')
    setMoveItem(null)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar folders={folders} onNewFolder={() => setShowNewFolder(true)} onSignOut={signOut} userEmail={user?.email} />

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <header className="flex items-center gap-2 px-4 py-3 border-b border-[#e5e7eb]">
          <Star size={16} className="text-amber-400" fill="currentColor" />
          <h1 className="text-base font-semibold">Starred</h1>
          <span className="text-xs text-[#888888]">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="space-y-3"><FeedCardSkeleton /><FeedCardSkeleton /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-14 h-14 bg-[#f4f4f4] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star size={24} className="text-[#888888]" />
              </div>
              <p className="text-base font-medium text-[#333333] mb-2">No starred items</p>
              <p className="text-sm text-[#888888]">Star important items to find them here quickly</p>
            </div>
          ) : (
            <div className="space-y-3 max-w-2xl">
              {items.map((item) => (
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
            </div>
          )}
        </main>
      </div>

      <BottomNav />

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

      {showNewFolder && (
        <NewFolderModal
          onClose={() => setShowNewFolder(false)}
          onCreate={async (name, desc, color) => {
            await createFolder(name, desc, color)
            addToast(`Folder "${name}" created`, 'success')
          }}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
