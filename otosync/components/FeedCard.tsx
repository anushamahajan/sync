'use client'

import { useState, useRef, useEffect } from 'react'
import {
  FileText, Image, File, Link, HardDrive, Play,
  Star, MoreVertical, FolderOpen, Copy, Download, Trash2,
  ExternalLink, Sparkles, Hash
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

const TYPE_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  text:       { icon: <FileText size={14} />,  color: '#374151', bg: '#f4f4f4' },
  image:      { icon: <Image size={14} />,     color: '#7c3aed', bg: '#f5f3ff' },
  file:       { icon: <File size={14} />,      color: '#d97706', bg: '#fffbeb' },
  link:       { icon: <Link size={14} />,      color: '#0891b2', bg: '#e0f2fe' },
  drive_link: { icon: <HardDrive size={14} />, color: '#16a34a', bg: '#f0fdf4' },
  video_link: { icon: <Play size={14} />,      color: '#dc2626', bg: '#fef2f2' },
}

export function FeedCard({ item, folders, onDelete, onToggleStar, onMove, onOpen }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const folder = folders.find((f) => f.id === item.folder_id)
  const meta = TYPE_META[item.type] ?? TYPE_META.text

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleCopy() {
    await navigator.clipboard.writeText(item.content || item.link_url || item.file_url || '')
    setMenuOpen(false)
  }

  function handleDownload() {
    if (!item.file_url) return
    const a = document.createElement('a')
    a.href = item.file_url
    a.download = item.file_name || 'download'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setMenuOpen(false)
  }

  function handleDelete() {
    if (confirm('Delete this item? This cannot be undone.')) {
      onDelete(item.id)
    }
    setMenuOpen(false)
  }

  const ytThumb = item.type === 'video_link' && item.link_url ? getYouTubeThumbnail(item.link_url) : null
  const hasAI = !!item.ai_description

  return (
    <div
      className="bg-white border border-[#e5e7eb] rounded-xl p-4 hover:border-[#d1d5db] hover:shadow-sm transition-all cursor-pointer group"
      onClick={() => onOpen(item)}
    >
      <div className="flex gap-3">
        {/* Thumbnail or type icon */}
        <div className="shrink-0 mt-0.5">
          {item.type === 'image' && item.file_url ? (
            <img
              src={item.file_url}
              alt=""
              className="w-12 h-12 rounded-lg object-cover border border-[#e5e7eb]"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : ytThumb ? (
            <div className="relative w-16 h-10 rounded-lg overflow-hidden border border-[#e5e7eb]">
              <img src={ytThumb} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Play size={12} className="text-white fill-white" />
              </div>
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: meta.bg, color: meta.color }}
            >
              {meta.icon}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <ContentPreview item={item} />

          {/* AI description */}
          {hasAI && (
            <div className="flex items-start gap-1 mt-1.5">
              <Sparkles size={10} className="text-[#0891b2] shrink-0 mt-0.5" />
              <p className="text-xs text-[#64748b] leading-relaxed line-clamp-1">{item.ai_description}</p>
            </div>
          )}

          {/* Tags row */}
          {(item.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {(item.tags ?? []).slice(0, 4).map((tag) => (
                <span key={tag} className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-[#e0f2fe] text-[#0369a1] font-medium">
                  <Hash size={8} />
                  {tag}
                </span>
              ))}
              {(item.tags ?? []).length > 4 && (
                <span className="text-[10px] text-[#888888]">+{(item.tags ?? []).length - 4}</span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-start gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onToggleStar(item.id, item.is_starred)}
            className={`p-1.5 rounded-lg transition-colors ${
              item.is_starred
                ? 'text-amber-400'
                : 'text-[#e5e7eb] hover:text-[#888888] opacity-0 group-hover:opacity-100'
            }`}
          >
            <Star size={14} fill={item.is_starred ? 'currentColor' : 'none'} />
          </button>

          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 rounded-lg text-[#e5e7eb] hover:text-[#555555] hover:bg-[#f4f4f4] opacity-0 group-hover:opacity-100 transition-all"
            >
              <MoreVertical size={14} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 bg-white border border-[#e5e7eb] rounded-xl shadow-lg py-1 z-30 w-48 modal-enter">
                <MenuItem icon={<FolderOpen size={14} />} label="Move to folder" onClick={() => { onMove(item); setMenuOpen(false) }} />
                {(item.type === 'text' || item.type === 'link' || item.type === 'video_link') && (
                  <MenuItem icon={<Copy size={14} />} label="Copy" onClick={handleCopy} />
                )}
                {(item.type === 'file' || item.type === 'image') && item.file_url && (
                  <MenuItem icon={<Download size={14} />} label="Download" onClick={handleDownload} />
                )}
                {(item.type === 'drive_link' || item.type === 'link' || item.type === 'video_link') && item.link_url && (
                  <MenuItem icon={<ExternalLink size={14} />} label="Open link" onClick={() => { window.open(item.link_url, '_blank'); setMenuOpen(false) }} />
                )}
                <div className="h-px bg-[#f0f0f0] my-1 mx-2" />
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
            style={{ backgroundColor: folder.color + '18', color: folder.color }}
          >
            {folder.name}
          </span>
        )}
        {!hasAI && (
          <span className="flex items-center gap-0.5 text-[10px] text-[#aaaaaa]">
            <Sparkles size={9} />
            AI pending
          </span>
        )}
        {item.source_device && (
          <span className="text-xs text-[#aaaaaa] capitalize">{item.source_device}</span>
        )}
        <span className="text-xs text-[#aaaaaa] ml-auto">{formatTimeAgo(item.created_at)}</span>
      </div>
    </div>
  )
}

function ContentPreview({ item }: { item: Item }) {
  const cls = 'text-sm text-[#111111] leading-snug font-medium'

  if (item.type === 'text') {
    return <p className={cls + ' font-normal line-clamp-2'}>{truncate(item.content ?? '', 140)}</p>
  }
  if (item.type === 'image') {
    return (
      <p className={cls}>
        {item.file_name ?? 'Image'}
        {item.file_size_bytes ? <span className="font-normal text-[#888888] ml-1.5">· {formatFileSize(item.file_size_bytes)}</span> : ''}
      </p>
    )
  }
  if (item.type === 'file') {
    return (
      <div>
        <p className={cls}>{item.file_name ?? 'File'}</p>
        {item.file_size_bytes && <p className="text-xs text-[#888888] mt-0.5">{formatFileSize(item.file_size_bytes)}</p>}
      </div>
    )
  }
  if (item.type === 'link') {
    return (
      <div>
        <p className={cls + ' line-clamp-1'}>{item.link_title || item.link_url}</p>
        {item.link_url && <p className="text-xs text-[#888888] mt-0.5">{getDomainFromUrl(item.link_url)}</p>}
      </div>
    )
  }
  if (item.type === 'drive_link') {
    return (
      <div>
        <p className={cls + ' line-clamp-1'}>{item.drive_file_title || 'Google Drive file'}</p>
        <p className="text-xs text-[#888888] mt-0.5">Google Drive</p>
      </div>
    )
  }
  if (item.type === 'video_link') {
    return (
      <div>
        <p className={cls + ' line-clamp-1'}>{item.link_title || item.link_url}</p>
        {item.link_url && <p className="text-xs text-[#888888] mt-0.5">{getDomainFromUrl(item.link_url)}</p>}
      </div>
    )
  }
  return null
}

function MenuItem({ icon, label, onClick, danger }: {
  icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean
}) {
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
    <div className="bg-white border border-[#e5e7eb] rounded-xl p-4">
      <div className="flex gap-3">
        <div className="skeleton w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-4/5 rounded" />
          <div className="skeleton h-3 w-3/5 rounded" />
          <div className="skeleton h-3 w-2/3 rounded" />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <div className="skeleton h-3 w-16 rounded-full" />
        <div className="skeleton h-3 w-12 rounded-full ml-auto" />
      </div>
    </div>
  )
}
