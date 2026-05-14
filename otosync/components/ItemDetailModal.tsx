'use client'

import { useState } from 'react'
import { X, Copy, Download, FolderOpen, Trash2, ExternalLink, Star, Tag, BookOpen } from 'lucide-react'
import { formatTimeAgo, formatFileSize } from '@/lib/utils'
import type { Item, Folder } from '@/types'

interface Props {
  item: Item
  folders: Folder[]
  onClose: () => void
  onDelete: (id: string) => void
  onToggleStar: (id: string, current: boolean) => void
  onMove: (item: Item) => void
}

export function ItemDetailModal({ item, folders, onClose, onDelete, onToggleStar, onMove }: Props) {
  const [copied, setCopied] = useState(false)
  const folder = folders.find((f) => f.id === item.folder_id)

  async function handleCopy() {
    const text = item.content || item.link_url || ''
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDelete() {
    if (confirm('Delete this item? This cannot be undone.')) {
      onDelete(item.id)
      onClose()
    }
  }

  const typeLabels: Record<string, string> = {
    text: 'Text', image: 'Image', file: 'File', link: 'Link', drive_link: 'Drive Link', video_link: 'Video'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch justify-end">
      <div className="absolute inset-0 bg-black/30 md:bg-black/20" onClick={onClose} />
      <div className="relative bg-white w-full md:w-[440px] h-[85vh] md:h-full flex flex-col rounded-t-2xl md:rounded-none md:border-l border-[#e5e7eb] modal-enter">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#888888] uppercase tracking-wider">{typeLabels[item.type]}</span>
            {folder && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: folder.color + '20', color: folder.color }}>
                {folder.name}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-[#888888] hover:text-[#111111]"><X size={18} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Main content */}
          {item.type === 'text' && (
            <p className="text-sm text-[#111111] leading-relaxed whitespace-pre-wrap">{item.content}</p>
          )}
          {item.type === 'image' && item.file_url && (
            <img src={item.file_url} alt="" className="w-full rounded-xl border border-[#e5e7eb]" />
          )}
          {item.type === 'file' && (
            <div className="bg-[#f4f4f4] rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg border border-[#e5e7eb] flex items-center justify-center text-xs font-bold text-[#888888]">
                {item.file_name?.split('.').pop()?.toUpperCase().slice(0, 4) ?? 'FILE'}
              </div>
              <div>
                <p className="text-sm font-medium">{item.file_name}</p>
                {item.file_size_bytes && <p className="text-xs text-[#888888]">{formatFileSize(item.file_size_bytes)}</p>}
              </div>
            </div>
          )}
          {(item.type === 'link' || item.type === 'video_link') && (
            <div>
              <p className="text-sm font-medium mb-1">{item.link_title || item.link_url}</p>
              <a href={item.link_url ?? ''} target="_blank" rel="noopener" className="text-xs text-[#0891b2] hover:underline break-all">
                {item.link_url}
              </a>
            </div>
          )}
          {item.type === 'drive_link' && (
            <div>
              <p className="text-sm font-medium mb-1">{item.drive_file_title || 'Google Drive file'}</p>
              <a href={item.link_url ?? ''} target="_blank" rel="noopener" className="text-xs text-[#0891b2] hover:underline break-all">
                {item.link_url}
              </a>
              <div className="mt-3 bg-[#f0f9ff] border border-[#bae6fd] rounded-xl px-3 py-2.5">
                <p className="text-xs text-[#0369a1]"><span className="font-medium">Live reading coming soon</span> — connect Drive to let AI read this doc.</p>
              </div>
            </div>
          )}

          {/* AI description */}
          {item.ai_description && (
            <div className="border-t border-[#e5e7eb] pt-3">
              <p className="text-xs font-medium text-[#888888] mb-1">AI Summary</p>
              <p className="text-sm text-[#333333]">{item.ai_description}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-[#e5e7eb] pt-3 space-y-1.5">
            <MetaRow label="Added" value={formatTimeAgo(item.created_at)} />
            {item.source_device && <MetaRow label="Device" value={item.source_device} />}
            {item.ai_suggested_folder && <MetaRow label="AI suggested folder" value={item.ai_suggested_folder} />}
          </div>

          {/* Coming soon features */}
          <div className="border-t border-[#e5e7eb] pt-3 space-y-2">
            <p className="text-xs font-medium text-[#888888] mb-2">Coming Soon</p>
            <ComingSoonButton icon={<Tag size={14} />} label="Add tags" />
            {item.type === 'text' && <ComingSoonButton icon={<BookOpen size={14} />} label="Reading mode" />}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-[#e5e7eb] px-5 py-3 flex flex-wrap gap-2">
          <button
            onClick={() => onToggleStar(item.id, item.is_starred)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border transition-colors ${
              item.is_starred ? 'border-amber-300 text-amber-500 bg-amber-50' : 'border-[#e5e7eb] text-[#333333] hover:bg-[#f8f9fa]'
            }`}
          >
            <Star size={13} fill={item.is_starred ? 'currentColor' : 'none'} />
            {item.is_starred ? 'Starred' : 'Star'}
          </button>

          <button
            onClick={() => onMove(item)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border border-[#e5e7eb] text-[#333333] hover:bg-[#f8f9fa] transition-colors"
          >
            <FolderOpen size={13} />
            Move
          </button>

          {(item.type === 'text' || item.type === 'link') && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border border-[#e5e7eb] text-[#333333] hover:bg-[#f8f9fa] transition-colors"
            >
              <Copy size={13} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}

          {(item.type === 'file' || item.type === 'image') && item.file_url && (
            <a
              href={item.file_url}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border border-[#e5e7eb] text-[#333333] hover:bg-[#f8f9fa] transition-colors"
            >
              <Download size={13} />
              Download
            </a>
          )}

          {(item.type === 'drive_link' || item.type === 'link') && item.link_url && (
            <a
              href={item.link_url}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border border-[#e5e7eb] text-[#333333] hover:bg-[#f8f9fa] transition-colors"
            >
              <ExternalLink size={13} />
              Open
            </a>
          )}

          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border border-[#e5e7eb] text-[#d32f2f] hover:bg-red-50 transition-colors ml-auto"
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[#888888]">{label}</span>
      <span className="text-[#333333] capitalize">{value}</span>
    </div>
  )
}

function ComingSoonButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button disabled className="flex items-center gap-2 text-xs text-[#888888] cursor-not-allowed opacity-60">
      {icon}
      {label}
      <span className="text-[10px] bg-[#f0f9ff] text-[#0369a1] px-1.5 py-0.5 rounded-full font-medium">Soon</span>
    </button>
  )
}
