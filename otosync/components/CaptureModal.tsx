'use client'

import { useState, useRef } from 'react'
import { X, FileText, Image, File, Link, HardDrive, Upload, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { triggerCategorization } from '@/lib/categorize'
import { extractDriveFileId, isDriveUrl, isYouTubeUrl, getDeviceType } from '@/lib/utils'
import type { Item, Folder } from '@/types'

interface Props {
  onClose: () => void
  folders: Folder[]
  onSaved: (item: Item) => void
}

type Tab = 'text' | 'image' | 'file' | 'link' | 'drive_link'
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'text', label: 'Text', icon: <FileText size={14} /> },
  { id: 'image', label: 'Image', icon: <Image size={14} /> },
  { id: 'file', label: 'File', icon: <File size={14} /> },
  { id: 'link', label: 'Link', icon: <Link size={14} /> },
  { id: 'drive_link', label: 'Drive', icon: <HardDrive size={14} /> },
]

const MAX_FILE_SIZE = 25 * 1024 * 1024

export function CaptureModal({ onClose, folders, onSaved }: Props) {
  const [tab, setTab] = useState<Tab>('text')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  const [text, setText] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [driveUrl, setDriveUrl] = useState('')

  const supabase = createClient()

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) { setError('File too large. Max 25MB.'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) { setError('File too large. Max 25MB.'); return }
    setUploadFile(file)
    setError('')
  }

  function handleLinkUrlChange(url: string) {
    setLinkUrl(url)
    if (isDriveUrl(url)) { setTab('drive_link'); setDriveUrl(url) }
    else if (isYouTubeUrl(url)) {}
    setError('')
  }

  async function uploadToStorage(file: File, path: string): Promise<string> {
    const { error } = await supabase.storage.from('vault').upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from('vault').getPublicUrl(path)
    return data.publicUrl
  }

  async function save() {
    setError('')
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const device = getDeviceType()
      let insertData: Partial<Item> = { user_id: user.id, source_device: device, is_starred: false }

      if (tab === 'text') {
        if (!text.trim()) { setError('Please enter some text'); setSaving(false); return }
        insertData = { ...insertData, type: 'text', content: text.trim() }
      }

      else if (tab === 'image') {
        if (!imageFile) { setError('Please select an image'); setSaving(false); return }
        const tempId = crypto.randomUUID()
        const path = `${user.id}/images/${tempId}`
        const url = await uploadToStorage(imageFile, path)
        insertData = { ...insertData, type: 'image', file_url: url, file_name: imageFile.name, file_size_bytes: imageFile.size }
      }

      else if (tab === 'file') {
        if (!uploadFile) { setError('Please select a file'); setSaving(false); return }
        const tempId = crypto.randomUUID()
        const path = `${user.id}/files/${tempId}_${uploadFile.name}`
        const url = await uploadToStorage(uploadFile, path)
        insertData = { ...insertData, type: 'file', file_url: url, file_name: uploadFile.name, file_size_bytes: uploadFile.size }
      }

      else if (tab === 'link') {
        if (!linkUrl.trim()) { setError('Please enter a URL'); setSaving(false); return }
        const type = isYouTubeUrl(linkUrl) ? 'video_link' : 'link'
        insertData = { ...insertData, type, link_url: linkUrl.trim(), link_title: linkTitle.trim() || getDomain(linkUrl) }
      }

      else if (tab === 'drive_link') {
        const url = driveUrl.trim()
        if (!url) { setError('Please enter a Drive URL'); setSaving(false); return }
        const fileId = extractDriveFileId(url)
        insertData = { ...insertData, type: 'drive_link', link_url: url, drive_file_id: fileId ?? undefined }
      }

      const { data: saved, error: insertError } = await supabase
        .from('items')
        .insert(insertData)
        .select()
        .single()

      if (insertError) throw insertError

      onSaved(saved as Item)
      onClose()

      triggerCategorization(saved.id, saved as Item, folders.map((f) => f.name))

    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  function canSave() {
    if (tab === 'text') return text.trim().length > 0
    if (tab === 'image') return imageFile !== null
    if (tab === 'file') return uploadFile !== null
    if (tab === 'link') return linkUrl.trim().length > 0
    if (tab === 'drive_link') return driveUrl.trim().length > 0
    return false
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl md:rounded-2xl w-full max-w-lg slide-up md:modal-enter">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
          <h2 className="text-base font-semibold">Capture</h2>
          <button onClick={onClose} className="text-[#888888] hover:text-[#111111]"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e5e7eb] px-5">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setError('') }}
              className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-colors -mb-px ${
                tab === id
                  ? 'border-[#0891b2] text-[#0891b2]'
                  : 'border-transparent text-[#888888] hover:text-[#333333]'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-5 py-4 min-h-[180px]">
          {tab === 'text' && (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste anything…"
              className="w-full h-36 text-sm border border-[#e5e7eb] rounded-xl p-3 outline-none focus:border-[#0891b2] resize-none transition-colors"
              autoFocus
            />
          )}

          {tab === 'image' && (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[#e5e7eb] rounded-xl cursor-pointer hover:border-[#0891b2] transition-colors">
                {imagePreview ? (
                  <img src={imagePreview} alt="" className="h-full w-full object-contain rounded-xl p-1" />
                ) : (
                  <>
                    <Upload size={24} className="text-[#888888] mb-2" />
                    <span className="text-sm text-[#888888]">Click to select image</span>
                    <span className="text-xs text-[#888888] mt-1">JPG, PNG, GIF, WebP · Max 25MB</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </label>
              {imageFile && <p className="text-xs text-[#888888]">{imageFile.name}</p>}
            </div>
          )}

          {tab === 'file' && (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[#e5e7eb] rounded-xl cursor-pointer hover:border-[#0891b2] transition-colors">
                {uploadFile ? (
                  <div className="text-center">
                    <File size={32} className="text-[#0891b2] mx-auto mb-2" />
                    <p className="text-sm font-medium">{uploadFile.name}</p>
                    <p className="text-xs text-[#888888]">{(uploadFile.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                ) : (
                  <>
                    <Upload size={24} className="text-[#888888] mb-2" />
                    <span className="text-sm text-[#888888]">Click to select file</span>
                    <span className="text-xs text-[#888888] mt-1">Any file type · Max 25MB</span>
                  </>
                )}
                <input type="file" className="hidden" onChange={handleFileSelect} />
              </label>
            </div>
          )}

          {tab === 'link' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#333333] mb-1.5">URL *</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => handleLinkUrlChange(e.target.value)}
                  placeholder="https://…"
                  className="w-full border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0891b2] transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#333333] mb-1.5">Title <span className="text-[#888888] font-normal">(optional)</span></label>
                <input
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Give it a name"
                  className="w-full border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0891b2] transition-colors"
                />
              </div>
            </div>
          )}

          {tab === 'drive_link' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#333333] mb-1.5">Google Drive URL *</label>
                <input
                  type="url"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/…"
                  className="w-full border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0891b2] transition-colors"
                  autoFocus
                />
              </div>
              <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl px-3 py-2.5">
                <p className="text-xs text-[#0369a1]">
                  <span className="font-medium">Coming soon:</span> Live content reading. For now, the link and file ID are saved so you can open it anytime.
                </p>
              </div>
            </div>
          )}

          {error && <p className="mt-2 text-xs text-[#d32f2f]">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#e5e7eb] flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#e5e7eb] rounded-xl text-sm text-[#333333] hover:bg-[#f8f9fa] transition-colors">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !canSave()}
            className="flex-1 py-2.5 bg-[#0891b2] hover:bg-[#0e7490] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', '') } catch { return url }
}
