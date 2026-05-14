'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

const COLORS = ['#0891b2', '#7c3aed', '#16a34a', '#dc2626', '#d97706', '#db2777']

interface Props {
  onClose: () => void
  onCreate: (name: string, description: string, color: string) => Promise<void>
}

export function NewFolderModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    try {
      await onCreate(name, description, color)
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Failed to create folder')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-6 modal-enter">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold">New Folder</h2>
          <button onClick={onClose} className="text-[#888888] hover:text-[#111111]"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#333333] mb-1.5">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Job Applications"
              className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0891b2] transition-colors"
              autoFocus
            />
            {error && <p className="text-xs text-[#d32f2f] mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#333333] mb-1.5">Description <span className="text-[#888888] font-normal">(optional)</span></label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this folder for?"
              className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0891b2] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#333333] mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-[#111111]' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-[#e5e7eb] rounded-xl text-sm text-[#333333] hover:bg-[#f8f9fa] transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 py-2.5 bg-[#0891b2] hover:bg-[#0e7490] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
