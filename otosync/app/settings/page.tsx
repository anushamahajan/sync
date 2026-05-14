'use client'

export const dynamic = 'force-dynamic'

import { ArrowLeft, HardDrive, Download, AlertTriangle, LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { BottomNav } from '@/components/BottomNav'
import { useFolders } from '@/hooks/useFolders'
import { Sidebar } from '@/components/Sidebar'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { folders, createFolder } = useFolders()
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar
        folders={folders}
        onNewFolder={() => {}}
        onSignOut={signOut}
        userEmail={user?.email}
      />

      <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {/* Header */}
        <header className="sticky top-0 bg-white border-b border-[#e5e7eb] px-4 py-3 flex items-center gap-3 z-10">
          <Link href="/vault" className="text-[#888888] hover:text-[#111111] md:hidden">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-base font-semibold">Settings</h1>
        </header>

        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

          {/* Account */}
          <Section title="Account">
            <div className="flex items-center gap-4 p-4 bg-[#f8f9fa] rounded-xl">
              <div className="w-11 h-11 rounded-full bg-[#e9ecef] flex items-center justify-center">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="" className="w-11 h-11 rounded-full" />
                ) : (
                  <User size={20} className="text-[#888888]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.user_metadata?.full_name ?? user?.email}</p>
                <p className="text-xs text-[#888888] truncate">{user?.email}</p>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-2 border border-[#e5e7eb] rounded-xl text-xs text-[#333333] hover:bg-white transition-colors shrink-0"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          </Section>

          {/* Google Drive */}
          <Section title="Google Drive">
            <div className="p-4 rounded-xl border border-[#bae6fd] bg-[#f0f9ff]">
              <div className="flex items-start gap-3">
                <HardDrive size={18} className="text-[#0369a1] mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-[#0369a1]">Connect Google Drive</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#bae6fd] text-[#0369a1] px-2 py-0.5 rounded-full">Coming Soon</span>
                  </div>
                  <p className="text-xs text-[#0369a1] leading-relaxed">
                    Connect your Drive to let AI read your Google Docs inside folders. When live, your saved Drive links will be read in real time.
                  </p>
                </div>
              </div>
              <button
                disabled
                className="mt-3 w-full py-2.5 border border-[#bae6fd] rounded-xl text-sm text-[#0369a1] opacity-50 cursor-not-allowed"
              >
                Connect Google Drive
              </button>
            </div>
          </Section>

          {/* Export */}
          <Section title="Export Vault">
            <div className="p-4 rounded-xl border border-[#e5e7eb] bg-[#f8f9fa]">
              <div className="flex items-start gap-3 mb-3">
                <Download size={18} className="text-[#888888] mt-0.5 shrink-0" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-[#333333]">Download your data</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#f0f9ff] text-[#0369a1] px-2 py-0.5 rounded-full">Coming Soon</span>
                  </div>
                  <p className="text-xs text-[#888888] leading-relaxed">Export all your saved items as JSON or CSV.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button disabled className="flex-1 py-2.5 border border-[#e5e7eb] rounded-xl text-xs text-[#888888] opacity-50 cursor-not-allowed">
                  Export JSON
                </button>
                <button disabled className="flex-1 py-2.5 border border-[#e5e7eb] rounded-xl text-xs text-[#888888] opacity-50 cursor-not-allowed">
                  Export CSV
                </button>
              </div>
            </div>
          </Section>

          {/* Upcoming features */}
          <Section title="Coming Soon">
            <div className="space-y-2">
              {[
                'Bulk select & bulk actions',
                'Share items via link',
                'Tags & labels',
                'Video transcript reading',
                'Device management',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#f8f9fa]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#bae6fd]" />
                  <span className="text-sm text-[#333333]">{feature}</span>
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-[#f0f9ff] text-[#0369a1] px-2 py-0.5 rounded-full">Soon</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Danger Zone */}
          <Section title="Danger Zone">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#f87171] text-[#d32f2f] text-sm hover:bg-red-50 transition-colors w-full"
              >
                <AlertTriangle size={16} />
                Delete all my data
              </button>
            ) : (
              <div className="border border-[#f87171] rounded-xl p-4 space-y-3">
                <p className="text-sm text-[#d32f2f] font-medium">This will permanently delete all your items, folders, and files.</p>
                <p className="text-xs text-[#888888]">Type <strong>DELETE</strong> to confirm:</p>
                <input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="w-full border border-[#e5e7eb] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#d32f2f] transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirm('') }}
                    className="flex-1 py-2.5 border border-[#e5e7eb] rounded-xl text-sm text-[#333333] hover:bg-[#f8f9fa] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={deleteConfirm !== 'DELETE'}
                    className="flex-1 py-2.5 bg-[#d32f2f] text-white rounded-xl text-sm font-medium disabled:opacity-40 transition-colors"
                  >
                    Delete everything
                  </button>
                </div>
              </div>
            )}
          </Section>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  )
}
