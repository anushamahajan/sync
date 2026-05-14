'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Inbox, FolderOpen, Settings } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()

  const tabs = [
    { href: '/vault', icon: Inbox, label: 'Feed' },
    { href: '/folders', icon: FolderOpen, label: 'Folders' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e7eb] z-40 safe-bottom">
      <div className="flex">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                active ? 'text-[#0891b2]' : 'text-[#888888]'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className={active ? 'font-medium' : ''}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
