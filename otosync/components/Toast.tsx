'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import type { Toast as ToastType } from '@/types'

interface ToastProps {
  toasts: ToastType[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 md:bottom-6">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: ToastType; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id])

  const styles = {
    success: 'bg-white border-[#22c55e] text-[#111111]',
    error: 'bg-white border-[#d32f2f] text-[#111111]',
    info: 'bg-white border-[#0891b2] text-[#111111]',
  }

  const icons = {
    success: <CheckCircle size={16} className="text-[#22c55e] shrink-0" />,
    error: <AlertCircle size={16} className="text-[#d32f2f] shrink-0" />,
    info: <Info size={16} className="text-[#0891b2] shrink-0" />,
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border-2 shadow-lg ${styles[toast.type]} modal-enter`}>
      {icons[toast.type]}
      <span className="text-sm flex-1">{toast.message}</span>
      {toast.action && (
        <button
          onClick={toast.action.onClick}
          className="text-xs font-semibold text-[#0891b2] shrink-0"
        >
          {toast.action.label}
        </button>
      )}
      <button onClick={() => onDismiss(toast.id)} className="text-[#888888] hover:text-[#111111] shrink-0">
        <X size={14} />
      </button>
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastType[]>([])

  function addToast(message: string, type: ToastType['type'] = 'info', action?: ToastType['action']) {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type, action }])
  }

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return { toasts, addToast, dismiss }
}
