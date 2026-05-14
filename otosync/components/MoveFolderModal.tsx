'use client'

import { X, FolderOpen, Inbox } from 'lucide-react'
import type { Folder } from '@/types'

interface Props {
  folders: Folder[]
  currentFolderId?: string
  onClose: () => void
  onMove: (folderId: string | null) => Promise<void>
}

export function MoveFolderModal({ folders, currentFolderId, onClose, onMove }: Props) {
  async function handleMove(folderId: string | null) {
    await onMove(folderId)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl md:rounded-2xl w-full max-w-sm p-5 modal-enter">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Move to Folder</h2>
          <button onClick={onClose} className="text-[#888888] hover:text-[#111111]"><X size={18} /></button>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => handleMove(null)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
              !currentFolderId ? 'bg-[#f4f4f4] font-medium' : 'hover:bg-[#f8f9fa]'
            }`}
          >
            <Inbox size={16} className="text-[#888888]" />
            <span>No folder (Unassigned)</span>
          </button>

          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => handleMove(folder.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                folder.id === currentFolderId ? 'bg-[#f4f4f4] font-medium' : 'hover:bg-[#f8f9fa]'
              }`}
            >
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: folder.color }} />
              <span>{folder.name}</span>
              {folder.id === currentFolderId && <span className="ml-auto text-xs text-[#888888]">current</span>}
            </button>
          ))}

          {folders.length === 0 && (
            <p className="text-sm text-[#888888] text-center py-4">No folders yet. Create one first.</p>
          )}
        </div>
      </div>
    </div>
  )
}
