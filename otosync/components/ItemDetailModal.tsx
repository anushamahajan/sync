'use client'

import { useState, KeyboardEvent } from 'react'
import {
  X, Copy, Download, FolderOpen, Trash2, ExternalLink, Star, Tag,
  Sparkles, Plus, Check, ChevronRight, FileText, Image, File, Link,
  HardDrive, Play, Hash
} from 'lucide-react'
import { formatTimeAgo, formatFileSize, resolveFileUrl } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { triggerCategorization } from '@/lib/categorize'
import type { Item, Folder } from '@/types'

interface Props {
  item: Item
  folders: Folder[]
  onClose: () => void
  onDelete: (id: string) => void
  onToggleStar: (id: string, current: boolean) => void
  onMove: (item: Item) => void
}

const TAG_SUGGESTIONS = [
  'Work', 'Personal', 'Research', 'AI', 'Job Search', 'Project',
  'Reference', 'Read Later', 'Important', 'Finance', 'Health', 'Travel',
  'Ideas', 'Client', 'Archive'
]

const TYPE_COLORS: Record<string, string> = {
  text: '#374151',
  image: '#7c3aed',
  file: '#d97706',
  link: '#0891b2',
  drive_link: '#16a34a',
  video_link: '#dc2626',
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  text: <FileText size={12} />,
  image: <Image size={12} />,
  file: <File size={12} />,
  link: <Link size={12} />,
  drive_link: <HardDrive size={12} />,
  video_link: <Play size={12} />,
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

export function ItemDetailModal({ item, folders, onClose, onDelete, onToggleStar, onMove }: Props) {
  const [copied, setCopied] = useState(false)
  const [tags, setTags] = useState<string[]>(item.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [savingTags, setSavingTags] = useState(false)
  const [tagError, setTagError] = useState('')
  const [retryingAI, setRetryingAI] = useState(false)
  const [aiRetried, setAiRetried] = useState(false)

  const folder = folders.find((f) => f.id === item.folder_id)
  const supabase = createClient()
  const resolvedFileUrl = resolveFileUrl(item.file_url)

  async function handleCopy() {
    const text = item.content || item.link_url || ''
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function retryAI() {
    setRetryingAI(true)
    triggerCategorization(item.id, item, folders.map((f) => f.name))
    await new Promise((r) => setTimeout(r, 3000))
    setRetryingAI(false)
    setAiRetried(true)
  }

  function handleDelete() {
    if (confirm('Delete this item? This cannot be undone.')) {
      onDelete(item.id)
      onClose()
    }
  }

  async function persistTags(newTags: string[]) {
    setSavingTags(true)
    setTagError('')
    try {
      const { error } = await supabase.from('items').update({ tags: newTags }).eq('id', item.id)
      if (error) {
        if (error.code === '42703') {
          setTagError('Run the migration in /supabase/migrations/add_tags_column.sql to enable tags.')
        } else {
          setTagError('Could not save tags.')
        }
      }
    } catch {
      setTagError('Could not save tags.')
    } finally {
      setSavingTags(false)
    }
  }

  async function addTag(tag: string) {
    const t = tag.trim()
    if (!t || tags.includes(t)) { setTagInput(''); return }
    const next = [...tags, t]
    setTags(next)
    setTagInput('')
    await persistTags(next)
  }

  async function removeTag(tag: string) {
    const next = tags.filter((t) => t !== tag)
    setTags(next)
    await persistTags(next)
  }

  function onTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) }
  }

  const typeLabels: Record<string, string> = {
    text: 'Text', image: 'Image', file: 'File',
    link: 'Link', drive_link: 'Drive', video_link: 'Video'
  }

  const ytId = item.type === 'video_link' && item.link_url ? getYouTubeId(item.link_url) : null
  const typeColor = TYPE_COLORS[item.type] ?? '#374151'

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch justify-end">
      <div className="absolute inset-0 bg-black/30 md:bg-black/20" onClick={onClose} />
      <div className="relative bg-white w-full md:w-[480px] h-[92vh] md:h-full flex flex-col rounded-t-2xl md:rounded-none md:border-l border-[#e5e7eb] modal-enter overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e5e7eb] shrink-0">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span
              className="flex items-center gap-1 text-[11px] font-semibold text-white px-2 py-0.5 rounded-md shrink-0"
              style={{ backgroundColor: typeColor }}
            >
              {TYPE_ICONS[item.type]}
              {typeLabels[item.type]}
            </span>
            {folder && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                style={{ backgroundColor: folder.color + '20', color: folder.color }}
              >
                {folder.name}
              </span>
            )}
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[#f4f4f4] text-[#555555] shrink-0">
                #{tag}
              </span>
            ))}
          </div>
          <button onClick={onClose} className="text-[#888888] hover:text-[#111111] transition-colors shrink-0 ml-2">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Content Preview ── */}
          <div className="px-5 pt-4 pb-3">
            {item.type === 'text' && (
              <div className="bg-[#f8f9fa] rounded-xl p-4 border border-[#e5e7eb] max-h-64 overflow-y-auto">
                <p className="text-sm text-[#111111] leading-relaxed whitespace-pre-wrap">{item.content}</p>
              </div>
            )}

            {item.type === 'image' && resolvedFileUrl && (
              <div className="rounded-xl overflow-hidden border border-[#e5e7eb] bg-[#f4f4f4]">
                <img src={resolvedFileUrl} alt={item.file_name ?? ''} className="w-full object-contain max-h-72" />
                {item.file_name && (
                  <div className="px-3 py-2 border-t border-[#e5e7eb]">
                    <p className="text-xs text-[#888888]">{item.file_name}{item.file_size_bytes ? ` · ${formatFileSize(item.file_size_bytes)}` : ''}</p>
                  </div>
                )}
              </div>
            )}

            {item.type === 'file' && (
              <div className="bg-[#f8f9fa] rounded-xl p-4 flex items-center gap-4 border border-[#e5e7eb]">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white"
                  style={{ backgroundColor: typeColor }}
                >
                  {item.file_name?.split('.').pop()?.toUpperCase().slice(0, 4) ?? 'FILE'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111111] truncate">{item.file_name}</p>
                  {item.file_size_bytes && (
                    <p className="text-xs text-[#888888] mt-0.5">{formatFileSize(item.file_size_bytes)}</p>
                  )}
                  <p className="text-xs text-[#0891b2] mt-1">Click Download to save this file</p>
                </div>
              </div>
            )}

            {ytId && (
              <div className="rounded-xl overflow-hidden border border-[#e5e7eb] bg-black">
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={item.link_title ?? 'Video'}
                  />
                </div>
                {item.link_title && (
                  <div className="px-3 py-2 bg-white border-t border-[#e5e7eb]">
                    <p className="text-xs font-medium text-[#111111]">{item.link_title}</p>
                  </div>
                )}
              </div>
            )}

            {item.type === 'video_link' && !ytId && (
              <div className="bg-[#fef2f2] rounded-xl p-4 border border-[#fecaca]">
                <p className="text-sm font-semibold text-[#111111] mb-1.5">{item.link_title || 'Video'}</p>
                <a href={item.link_url ?? ''} target="_blank" rel="noopener"
                  className="text-xs text-[#0891b2] hover:underline break-all flex items-center gap-1">
                  <ExternalLink size={11} />{item.link_url}
                </a>
              </div>
            )}

            {item.type === 'link' && (
              <div className="bg-[#f8f9fa] rounded-xl p-4 border border-[#e5e7eb]">
                <p className="text-sm font-semibold text-[#111111] mb-2">{item.link_title || item.link_url}</p>
                <a href={item.link_url ?? ''} target="_blank" rel="noopener"
                  className="text-xs text-[#0891b2] hover:underline break-all flex items-center gap-1.5">
                  <ExternalLink size={11} />{item.link_url}
                </a>
              </div>
            )}

            {item.type === 'drive_link' && (
              <div className="bg-[#f0fdf4] rounded-xl p-4 border border-[#bbf7d0]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#16a34a] rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">G</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111111] mb-1">{item.drive_file_title || 'Google Drive file'}</p>
                    <a href={item.link_url ?? ''} target="_blank" rel="noopener"
                      className="text-xs text-[#16a34a] hover:underline break-all flex items-center gap-1">
                      <ExternalLink size={11} />{item.link_url}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── AI Analysis ── */}
          <div className="px-5 pb-3">
            {(item.ai_description || item.ai_suggested_folder) ? (
              <div className="bg-gradient-to-br from-[#f0f9ff] to-[#fafbff] rounded-xl p-4 border border-[#bae6fd]">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles size={13} className="text-[#0369a1]" />
                  <span className="text-xs font-semibold text-[#0369a1] uppercase tracking-wide">AI Analysis</span>
                </div>
                {item.ai_description && (
                  <p className="text-sm text-[#1e40af] leading-relaxed mb-2.5">{item.ai_description}</p>
                )}
                {item.ai_suggested_folder && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-[#64748b]">Suggested folder:</span>
                    <span className="text-xs font-semibold text-[#0369a1] bg-[#dbeafe] px-2 py-0.5 rounded-full">
                      {item.ai_suggested_folder}
                    </span>
                    <button
                      onClick={() => onMove(item)}
                      className="flex items-center gap-0.5 text-xs text-[#0891b2] hover:text-[#0e7490] font-medium transition-colors"
                    >
                      Move there <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#f8f9fa] rounded-xl p-4 border border-[#e5e7eb] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="text-[#888888]" />
                  <span className="text-xs text-[#888888]">
                    {aiRetried ? 'AI analysis running — check back in a moment' : 'No AI analysis yet'}
                  </span>
                </div>
                {!aiRetried && (
                  <button
                    onClick={retryAI}
                    disabled={retryingAI}
                    className="text-xs text-[#0891b2] hover:text-[#0e7490] font-medium shrink-0 transition-colors disabled:opacity-50"
                  >
                    {retryingAI ? 'Analyzing…' : 'Run AI →'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Tags ── */}
          <div className="px-5 pb-3">
            <div className="border border-[#e5e7eb] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Hash size={13} className="text-[#888888]" />
                  <span className="text-xs font-semibold text-[#333333]">Tags</span>
                </div>
                {savingTags && <span className="text-xs text-[#888888]">saving…</span>}
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => removeTag(tag)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#0891b2] text-white font-medium hover:bg-[#0e7490] transition-colors group"
                      title="Click to remove"
                    >
                      #{tag}
                      <X size={10} className="opacity-60 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              )}

              <div className="relative">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={onTagKeyDown}
                  placeholder="Type a tag and press Enter…"
                  className="w-full text-xs border border-[#e5e7eb] rounded-lg px-3 py-2 outline-none focus:border-[#0891b2] focus:ring-1 focus:ring-[#0891b2]/10 transition-all bg-[#f8f9fa] focus:bg-white pr-8"
                />
                {tagInput && (
                  <button
                    onClick={() => addTag(tagInput)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#0891b2] hover:text-[#0e7490]"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>

              {tagError && <p className="text-xs text-[#d32f2f] mt-2 leading-relaxed">{tagError}</p>}

              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {TAG_SUGGESTIONS.filter((s) => !tags.includes(s)).slice(0, 8).map((s) => (
                  <button
                    key={s}
                    onClick={() => addTag(s)}
                    className="text-xs px-2 py-0.5 rounded-full bg-[#f4f4f4] text-[#555555] hover:bg-[#e0f2fe] hover:text-[#0891b2] transition-colors border border-[#e5e7eb] hover:border-[#bae6fd]"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Metadata ── */}
          <div className="px-5 pb-5">
            <div className="border-t border-[#e5e7eb] pt-3">
              <p className="text-[10px] font-semibold text-[#888888] mb-2.5 uppercase tracking-wider">Details</p>
              <div className="space-y-1.5">
                <MetaRow label="Saved" value={formatTimeAgo(item.created_at)} />
                {item.source_device && <MetaRow label="Device" value={item.source_device} />}
                {item.file_size_bytes && <MetaRow label="Size" value={formatFileSize(item.file_size_bytes)} />}
                {item.file_name && item.type === 'file' && <MetaRow label="File" value={item.file_name} />}
              </div>
            </div>
          </div>
        </div>

        {/* ── Actions bar ── */}
        <div className="border-t border-[#e5e7eb] px-5 py-3 flex flex-wrap gap-2 bg-[#f8f9fa] shrink-0">
          <ActionBtn
            onClick={() => onToggleStar(item.id, item.is_starred)}
            active={item.is_starred}
            activeClass="border-amber-300 text-amber-600 bg-amber-50"
          >
            <Star size={13} fill={item.is_starred ? 'currentColor' : 'none'} />
            {item.is_starred ? 'Starred' : 'Star'}
          </ActionBtn>

          <ActionBtn onClick={() => onMove(item)}>
            <FolderOpen size={13} />
            Move
          </ActionBtn>

          {(item.type === 'text' || item.type === 'link') && (
            <ActionBtn onClick={handleCopy} active={copied} activeClass="border-green-300 text-green-700 bg-green-50">
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </ActionBtn>
          )}

          {(item.type === 'file' || item.type === 'image') && resolvedFileUrl && (
            <a
              href={resolvedFileUrl}
              download={item.file_name || true}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border border-[#e5e7eb] text-[#333333] hover:bg-white bg-[#f8f9fa] transition-colors"
            >
              <Download size={13} />
              Download
            </a>
          )}

          {(item.type === 'drive_link' || item.type === 'link' || item.type === 'video_link') && item.link_url && (
            <a
              href={item.link_url}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border border-[#e5e7eb] text-[#333333] hover:bg-white bg-[#f8f9fa] transition-colors"
            >
              <ExternalLink size={13} />
              Open
            </a>
          )}

          <ActionBtn onClick={handleDelete} className="ml-auto border-[#e5e7eb] text-[#d32f2f] hover:bg-red-50">
            <Trash2 size={13} />
            Delete
          </ActionBtn>
        </div>

      </div>
    </div>
  )
}

function ActionBtn({
  children, onClick, active, activeClass, className,
}: {
  children: React.ReactNode
  onClick?: () => void
  active?: boolean
  activeClass?: string
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border transition-colors ${
        active && activeClass ? activeClass : `border-[#e5e7eb] text-[#333333] hover:bg-white bg-[#f8f9fa]`
      } ${className ?? ''}`}
    >
      {children}
    </button>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs gap-4">
      <span className="text-[#888888] shrink-0">{label}</span>
      <span className="text-[#333333] capitalize truncate text-right">{value}</span>
    </div>
  )
}
