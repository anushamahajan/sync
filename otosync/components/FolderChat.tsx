'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Sparkles, Send, Loader2, User, ChevronRight } from 'lucide-react'
import type { Item } from '@/types'

interface Props {
  folderName: string
  items: Item[]
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STARTERS = [
  'Summarize everything saved here',
  'What are the main themes?',
  'What should I work on next based on this?',
  'Draft a short update using this content',
]

export function FolderChat({ folderName, items }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return
    setInput('')
    setError('')

    const next: Message[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setLoading(true)

    try {
      const res = await fetch('/api/folder-chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, items, folderName }),
      })
      const data = await res.json()

      if (data.coming_soon) {
        setMessages([...next, {
          role: 'assistant',
          content: 'AI chat requires an OpenAI API key to be configured. Add OPENAI_API_KEY to your environment variables to enable this feature.',
        }])
        return
      }

      if (!res.ok || data.error) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      setMessages([...next, { role: 'assistant', content: data.message }])
    } catch {
      setError('Connection failed. Please check your internet and try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Context bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e5e7eb] bg-[#f8f9fa] shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-[#0891b2]" />
          <span className="text-xs text-[#333333]">
            AI has context for <strong>{items.length}</strong> item{items.length !== 1 ? 's' : ''} in <strong>{folderName}</strong>
          </span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs text-[#888888] hover:text-[#333333] transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6 min-h-[200px]">
            <div className="w-14 h-14 bg-gradient-to-br from-[#e0f2fe] to-[#dbeafe] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#bae6fd]">
              <Sparkles size={22} className="text-[#0891b2]" />
            </div>
            <p className="text-sm font-semibold text-[#111111] mb-1">Chat with AI about this folder</p>
            <p className="text-xs text-[#888888] leading-relaxed mb-5 max-w-sm">
              Ask questions, get summaries, or use your saved content to draft something new.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="flex items-center justify-between text-xs text-left px-3 py-2.5 rounded-xl bg-white border border-[#e5e7eb] hover:border-[#0891b2] hover:bg-[#f0f9ff] text-[#333333] hover:text-[#0891b2] transition-all group"
                >
                  <span>"{s}"</span>
                  <ChevronRight size={12} className="text-[#aaaaaa] group-hover:text-[#0891b2] shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === 'user'
                    ? 'bg-[#0891b2]'
                    : 'bg-[#f0f9ff] border border-[#bae6fd]'
                }`}>
                  {msg.role === 'user'
                    ? <User size={13} className="text-white" />
                    : <Sparkles size={13} className="text-[#0891b2]" />
                  }
                </div>
                <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#0891b2] text-white rounded-tr-sm'
                    : 'bg-[#f8f9fa] border border-[#e5e7eb] text-[#111111] rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#f0f9ff] border border-[#bae6fd] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles size={13} className="text-[#0891b2]" />
                </div>
                <div className="px-3.5 py-3 rounded-2xl rounded-tl-sm bg-[#f8f9fa] border border-[#e5e7eb]">
                  <div className="flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-[#0891b2] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-[#0891b2] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-[#0891b2] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="px-3 py-2.5 bg-[#fef2f2] border border-[#fecaca] rounded-xl text-xs text-[#d32f2f]">
                {error}
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#e5e7eb] px-4 py-3 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={items.length > 0 ? `Ask about ${folderName}…` : 'Add items to this folder first, then ask AI about them'}
            rows={1}
            style={{ minHeight: '40px', height: '40px' }}
            className="flex-1 border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0891b2] focus:ring-1 focus:ring-[#0891b2]/10 transition-all resize-none bg-[#f8f9fa] focus:bg-white overflow-hidden"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="p-2.5 bg-[#0891b2] hover:bg-[#0e7490] disabled:bg-[#e5e7eb] rounded-xl transition-colors shrink-0"
          >
            {loading
              ? <Loader2 size={15} className="text-white animate-spin" />
              : <Send size={15} className={!input.trim() ? 'text-[#aaaaaa]' : 'text-white'} />
            }
          </button>
        </div>
        <p className="text-[10px] text-[#aaaaaa] mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
