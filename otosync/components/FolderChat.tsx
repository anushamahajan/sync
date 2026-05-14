'use client'

import { Sparkles, Send, HardDrive } from 'lucide-react'

interface Props {
  folderName: string
  itemCount: number
}

export function FolderChat({ folderName, itemCount }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Coming soon banner */}
      <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-4 m-4 mb-0">
        <div className="flex items-start gap-3">
          <Sparkles size={18} className="text-[#0369a1] shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-[#0369a1]">AI Chat</p>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#bae6fd] text-[#0369a1] px-2 py-0.5 rounded-full">Coming Soon</span>
            </div>
            <p className="text-xs text-[#0369a1] leading-relaxed">
              Soon you'll be able to ask AI questions about everything in <strong>{folderName}</strong>. It'll read all your saved texts, links, and Google Docs.
            </p>
          </div>
        </div>
      </div>

      {/* Context bar */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[#e5e7eb] text-xs text-[#888888]">
        <span>{itemCount} item{itemCount !== 1 ? 's' : ''} in this folder</span>
        <div className="flex items-center gap-1.5">
          <HardDrive size={12} className="text-[#888888]" />
          <span>Drive docs: <span className="text-[#0369a1]">Connect Drive (coming soon)</span></span>
        </div>
      </div>

      {/* Chat history area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col items-center justify-center">
        <div className="text-center max-w-xs">
          <div className="w-14 h-14 bg-[#f0f9ff] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles size={24} className="text-[#0891b2]" />
          </div>
          <p className="text-sm font-medium text-[#333333] mb-2">AI Chat is coming soon</p>
          <p className="text-xs text-[#888888] leading-relaxed">
            When live, ask things like "Summarize what I've saved" or "Write a cover letter using my resume items."
          </p>
        </div>
      </div>

      {/* Input area (disabled) */}
      <div className="border-t border-[#e5e7eb] px-4 py-3">
        <div className="flex gap-2 items-center">
          <div className="flex-1 border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm text-[#888888] bg-[#f8f9fa] cursor-not-allowed select-none">
            AI chat coming soon…
          </div>
          <button
            disabled
            className="p-2.5 bg-[#e5e7eb] rounded-xl cursor-not-allowed"
          >
            <Send size={16} className="text-[#888888]" />
          </button>
        </div>
        <p className="text-xs text-[#888888] mt-2 text-center">
          Items in this folder will be used as context when AI chat launches.
        </p>
      </div>
    </div>
  )
}
