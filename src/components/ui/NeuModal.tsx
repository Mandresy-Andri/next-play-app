import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { NeuIconButton } from './NeuIconButton'

interface NeuModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  /** Don't close when clicking backdrop */
  persistent?: boolean
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
}

export function NeuModal({ open, onClose, title, description, children, size = 'md', persistent }: NeuModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Trap focus and handle Escape
  useEffect(() => {
    if (!open) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !persistent) onClose()
    }
    document.addEventListener('keydown', handleKey)
    // Prevent body scroll
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose, persistent])

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby={description ? 'modal-description' : undefined}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#1a2035]/30 backdrop-blur-sm"
            onClick={persistent ? undefined : onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={cn(
              'relative w-full z-10',
              'bg-[#eef1f6] rounded-2xl',
              'shadow-[12px_12px_24px_rgba(163,177,198,0.6),-12px_-12px_24px_rgba(255,255,255,0.9)]',
              'p-6',
              sizeMap[size]
            )}
          >
            {/* Header */}
            {(title || !persistent) && (
              <div className="flex items-start justify-between mb-5">
                <div>
                  {title && (
                    <h2 id="modal-title" className="text-lg font-bold text-[#1a2035] leading-tight">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id="modal-description" className="text-sm text-[#64748b] mt-1">
                      {description}
                    </p>
                  )}
                </div>
                <NeuIconButton
                  icon={<X />}
                  label="Close modal"
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="shrink-0 ml-4"
                />
              </div>
            )}

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
