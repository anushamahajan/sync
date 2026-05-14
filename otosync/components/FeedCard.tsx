'use client'

import { useState, useRef, useEffect } from 'react'
import {
  FileText, Image, File, Link, HardDrive, Play,
  Star, MoreVertical, FolderOpen, Copy, Download, Trash2, ExternalLink
} from 'lucide-react'
import { formatTimeAgo, formatFileSize, getDomainFromUrl, truncate, getYouTubeThumbnail } from '@/lib/utils'
import type { Item, Folder } from '@/types'

interface Props {
  item: Item
  folders: Folder[]
  onDelete: (id: string) => void
  onToggleStar: (id: string, current: boolean) => void
  onMove: (item: Item) => void
  onOpen: (item: Item) => void
}

const TYPE_ICONS = {
  text: <FileText size={18} className="text-[#333333]" />,
  image: <Image size={18} className="text-[#333333]" />,
  file: <File size={18} className="text-[#333333]" />,
  link: <Link size={18} className="text-[#333333]" />,
  drive_link: <HardDrive size={18} className="text-[#0891b2]" />,
  video_link: <Play size={18} className="text-[#333333]" />,
}

export function FeedCard({ item, folders, onDelete, onToggleStar, onMove, onOpen }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const folder = folders.find((f) => f.id === item.folder_id)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleCopy() {
    const text = item.content || item.link_url || item.file_url || ''
    await navigator.clipboard.writeText(text)
    setMenuOpen(false)
  }

  function handleDelete() {
    if (confirm('Delete this item? This cannot be undone.')) {
      onDelete(item.id)
    }
    setMenuOpen(false)
  }

  const ytThumb = item.type === 'video_link' && item.link_url ? getYouTubeThumbnail(item.link_url) : null

  return (
    <div
      className="bg-white border border-[#e5e7eb] rounded-xl p-3.5 hover:border-[#d1d5db] transition-colors cursor-pointer group"
      onClick={() => onOpen(item)}
    >
      <div className="flex gap-3">
        {/* Thumbnail or icon */}
        <div className="shrink-0 mt-0.5">
          {item.type === 'image' && item.file_url ? (
            <img
              src={item.file_url}
              alt=""
              className="w-12 h-12 rounded-lg object-cover border border-[#e5e7eb]"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : ytThumb ? (
            <img src={ytThumb} alt="" className="w-12 h-9 rounded-lg object-cover border border-[#e5e7eb]" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-[#f4f4f4] flex items-center justify-center">
              {TYPE_ICONS[item.type]}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <ContentPreview item={item} />

          {/* AI description */}
          <div className="mt-1">
            {item.ai_description ? (
              <p className="text-xs text-[#888888] leading-relaxed">{item.ai_description}</p>
            ) : (
              <div className="skeleton h-3 w-3/4 mt-1" />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-start gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onToggleStar(item.id, item.is_starred)}
            className={`p-1 rounded-lg transition-colors ${
              item.is_starred ? 'text-amber-400' : 'text-[#e5e7eb] hover:text-[#888888] opacity-0 group-hover:opacity-100'
            }`}
          >
            <Star size={15} fill={item.is_starred ? 'currentColor' : 'none'} />
          </button>

          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1 rounded-lg text-[#e5e7eb] hover:text-[#888888] opacity-0 group-hover:opacity-100 transition-colors"
            >
              <MoreVertical size={15} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-7 bg-white border border-[#e5e7eb] rounded-xl shadow-lg py-1 z-30 w-44 modal-enter">
                <MenuItem icon={<FolderOpen size={14} />} label="Move to folder" onClick={() => { onMove(item); setMenuOpen(false) }} />
                {(item.type === 'text' || item.type === 'link') && (
                  <MenuItem icon={<Copy size={14} />} label="Copy" onClick={handleCopy} />
                )}
                {(item.type === 'file' || item.type === 'image') && item.file_url && (
                  <MenuItem icon={<Download size={14} />} label="Download" onClick={() => { window.open(item.file_url, '_blank'); setMenuOpen(false) }} />
                )}
                {item.type === 'drive_link' && item.link_url && (
                  <MenuItem icon={<ExternalLink size={14} />} label="Open in Drive" onClick={() => { window.open(item.link_url, '_blank'); setMenuOpen(false) }} />
                )}
                <div className="h-px bg-[#e5e7eb] my-1" />
                <MenuItem icon={<Trash2 size={14} />} label="Delete" onClick={handleDelete} danger />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 mt-2.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
        {folder && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: folder.color + '20', color: folder.color }}
          >
            {folder.name}
          </span>
        )}
        {item.source_device && (
          <span className="text-xs text-[#888888] capitalize">{item.source_device}</span>
        )}
        <span className="text-xs text-[#888888] ml-auto">{formatTimeAgo(item.created_at)}</span>
      </div>
    </div>
  )
}

function ContentPreview({ item }: { item: Item }) {
  const cls = 'text-sm text-[#111111] leading-snug line-clamp-2'

  if (item.type === 'text') {
    return <p className={cls}>{truncate(item.content ?? '', 120)}</p>
  }
  if (item.type === 'image') {
    return <p className={cls + ' text-[#333333]'}>{item.file_name ?? 'Image'}{item.file_size_bytes ? ` · ${formatFileSize(item.file_size_bytes)}` : ''}</p>
  }
  if (item.type === 'file') {
    return (
      <div>
        <p className={cls}>{item.file_name ?? 'File'}</p>
        {item.file_size_bytes && <p className="text-xs text-[#888888]">{formatFileSize(item.file_size_bytes)}</p>}
      </div>
    )
  }
  if (item.type === 'link') {
    return (
      <div>
        <p className={cls}>{item.link_title || item.link_url}</p>
        {item.link_url && <p className="text-xs text-[#888888] mt-0.5">{getDomainFromUrl(item.link_url)}</p>}
      </div>
    )
  }
  if (item.type === 'drive_link') {
    return (
      <div>
        <p className={cls}>{item.drive_file_title || item.link_url || 'Google Drive file'}</p>
        <p className="text-xs text-[#888888] mt-0.5">Google Drive · reading coming soon</p>
      </div>
    )
  }
  if (item.type === 'video_link') {
    return (
      <div>
        <p className={cls}>{item.link_title || item.link_url}</p>
        {item.link_url && <p className="text-xs text-[#888888] mt-0.5">{getDomainFromUrl(item.link_url)}</p>}
      </div>
    )
  }
  return null
}

function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[#f8f9fa] transition-colors ${
        danger ? 'text-[#d32f2f]' : 'text-[#333333]'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

export function FeedCardSkeleton() {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl p-3.5">
      <div className="flex gap-3">
        <div className="skeleton w-9 h-9 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-4/5" />
          <div className="skeleton h-3 w-3/5" />
          <div className="skeleton h-3 w-2/3" />
        </div>
      </div>
    </div>
  )
}
