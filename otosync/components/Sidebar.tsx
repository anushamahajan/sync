'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Inbox, Star, FolderOpen, Settings, Plus, LogOut } from 'lucide-react'
import type { Folder } from '@/types'

interface SidebarProps {
  folders: Folder[]
  onNewFolder: () => void
  onSignOut: () => void
  userEmail?: string
}

export function Sidebar({ folders, onNewFolder, onSignOut, userEmail }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-[#e5e7eb] bg-white h-full shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-[#e5e7eb]">
        <span className="text-lg font-bold tracking-tight text-[#111111]">Sync</span>
        {userEmail && (
          <p className="text-xs text-[#888888] mt-0.5 truncate">{userEmail}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-0.5">
          <NavItem href="/vault" icon={<Inbox size={16} />} label="All Items" active={isActive('/vault')} />
          <NavItem href="/starred" icon={<Star size={16} />} label="Starred" active={isActive('/starred')} />
        </div>

        <div className="mt-4">
          <p className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider px-2 mb-1">Folders</p>
          <div className="space-y-0.5">
            {folders.map((folder) => (
              <Link
                key={folder.id}
                href={`/folder/${folder.id}`}
                className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive(`/folder/${folder.id}`)
                    ? 'bg-[#f4f4f4] text-[#111111] font-medium'
                    : 'text-[#333333] hover:bg-[#f8f9fa]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: folder.color }}
                />
                <span className="truncate">{folder.name}</span>
              </Link>
            ))}

            {folders.length === 0 && (
              <p className="text-xs text-[#888888] px-2 py-1">No folders yet</p>
            )}
          </div>
        </div>

        <button
          onClick={onNewFolder}
          className="flex items-center gap-2 mt-3 px-2 py-1.5 text-sm text-[#888888] hover:text-[#0891b2] transition-colors w-full"
        >
          <Plus size={15} />
          <span>New Folder</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="border-t border-[#e5e7eb] px-3 py-3 space-y-0.5">
        <NavItem href="/settings" icon={<Settings size={16} />} label="Settings" active={isActive('/settings')} />
        <button
          onClick={onSignOut}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-[#888888] hover:text-[#111111] hover:bg-[#f8f9fa] w-full transition-colors"
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors ${
        active ? 'bg-[#f4f4f4] text-[#111111] font-medium' : 'text-[#333333] hover:bg-[#f8f9fa]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}
