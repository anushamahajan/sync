'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Plus, FolderOpen } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useFolders } from '@/hooks/useFolders'
import { BottomNav } from '@/components/BottomNav'
import { Sidebar } from '@/components/Sidebar'
import { NewFolderModal } from '@/components/NewFolderModal'
import { useState } from 'react'

export default function FoldersPage() {
  const { user, signOut } = useAuth()
  const { folders, loading, createFolder } = useFolders()
  const [showNew, setShowNew] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar folders={folders} onNewFolder={() => setShowNew(true)} onSignOut={signOut} userEmail={user?.email} />

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <header className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb]">
          <h1 className="text-base font-semibold">Folders</h1>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0891b2] hover:bg-[#0e7490] text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={15} />
            New Folder
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-14 h-14 bg-[#f4f4f4] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FolderOpen size={24} className="text-[#888888]" />
              </div>
              <p className="text-base font-medium text-[#333333] mb-2">No folders yet</p>
              <p className="text-sm text-[#888888] mb-6">Create a folder to organize your saved items</p>
              <button
                onClick={() => setShowNew(true)}
                className="px-5 py-2.5 bg-[#0891b2] hover:bg-[#0e7490] text-white rounded-xl text-sm font-medium transition-colors"
              >
                + New Folder
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 max-w-xl">
              {folders.map((folder) => (
                <Link
                  key={folder.id}
                  href={`/folder/${folder.id}`}
                  className="flex items-center gap-3 p-4 rounded-xl border border-[#e5e7eb] hover:border-[#d1d5db] hover:bg-[#f8f9fa] transition-colors"
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: folder.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{folder.name}</p>
                    {folder.description && <p className="text-xs text-[#888888] truncate">{folder.description}</p>}
                  </div>
                  <span className="text-xs text-[#888888]">→</span>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>

      <BottomNav />

      {showNew && (
        <NewFolderModal
          onClose={() => setShowNew(false)}
          onCreate={async (name, desc, color) => {
            await createFolder(name, desc, color)
            setShowNew(false)
          }}
        />
      )}
    </div>
  )
}
