'use client'

import { useEffect } from 'react'
import type { ToastMessage } from '@/lib/types'

interface Props {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

const ICONS: Record<string, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'i',
}

const COLORS: Record<string, string> = {
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
}

function Toast({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
  useEffect(() => {
    const t = setTimeout(onRemove, 4000)
    return () => clearTimeout(t)
  }, [onRemove])

  return (
    <div
      className="flex items-start gap-3 min-w-72 rounded-xl px-4 py-3 shadow-lg bg-white border-l-4"
      style={{ borderLeftColor: COLORS[toast.type], animation: 'slideInRight 0.3s ease' }}
      role="alert"
    >
      <span
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5"
        style={{ background: COLORS[toast.type] }}
      >
        {ICONS[toast.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm">{toast.title}</p>
        <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{toast.message}</p>
      </div>
      <button onClick={onRemove} className="text-gray-300 hover:text-gray-500 text-lg leading-none flex-shrink-0" aria-label="Fermer">
        ×
      </button>
    </div>
  )
}

export default function ToastContainer({ toasts, onRemove }: Props) {
  return (
    <>
      <div className="fixed top-5 right-5 z-[11000] flex flex-col gap-2" role="region" aria-live="polite" aria-label="Notifications">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onRemove={() => onRemove(t.id)} />
        ))}
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  )
}
