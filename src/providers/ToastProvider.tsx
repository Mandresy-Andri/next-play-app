import React, { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ToastContext } from './ToastContext'
import type { Toast, ToastType } from './ToastContext'

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />,
  error:   <XCircle    className="w-4 h-4 text-red-500    shrink-0" aria-hidden="true" />,
  info:    <AlertCircle className="w-4 h-4 text-blue-500  shrink-0" aria-hidden="true" />,
}

const ACCENT: Record<ToastType, string> = {
  success: 'border-l-4 border-l-emerald-400',
  error:   'border-l-4 border-l-red-400',
  info:    'border-l-4 border-l-blue-400',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const duration = toast.duration ?? (toast.type === 'error' ? 6000 : 4000)

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(toast.id), duration)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [toast.id, duration, onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 64, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 64, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'flex items-start gap-3 px-4 py-3 w-80 max-w-[90vw]',
        'bg-[#eef1f6] rounded-2xl',
        'shadow-[8px_8px_16px_rgba(163,177,198,0.55),-6px_-6px_12px_rgba(255,255,255,0.85)]',
        ACCENT[toast.type]
      )}
      role="alert"
      aria-live="assertive"
    >
      {ICONS[toast.type]}
      <p className="flex-1 text-sm font-medium text-[#1a2035] leading-snug">
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        className={cn(
          'shrink-0 w-5 h-5 rounded-lg flex items-center justify-center',
          'text-[#94a3b8] hover:text-[#374156]',
          'transition-colors duration-150'
        )}
        aria-label="Dismiss notification"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts(prev => [...prev.slice(-4), { ...opts, id }]) // max 5 toasts
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast stack — fixed bottom-right */}
      <div
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 items-end pointer-events-none"
        aria-label="Notifications"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
