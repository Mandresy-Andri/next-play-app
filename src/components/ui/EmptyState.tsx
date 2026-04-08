import React from 'react'
import { cn } from '@/lib/cn'
import { NeuButton } from './NeuButton'

interface EmptyStateProps {
  /** Large icon or illustration node */
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

/**
 * Thoughtful empty state — never just "No tasks".
 * Uses the neumorphic surface, a soft illustration area, and a clear CTA.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-8',
        'rounded-2xl',
        'bg-[#eef1f6] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.45),inset_-4px_-4px_8px_rgba(255,255,255,0.7)]',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {icon && (
        <div
          className={cn(
            'w-20 h-20 rounded-2xl flex items-center justify-center mb-6',
            'bg-[#eef1f6]',
            'shadow-[6px_6px_12px_rgba(163,177,198,0.55),-6px_-6px_12px_rgba(255,255,255,0.85)]',
            'text-blue-400'
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <h3 className="text-base font-bold text-[#1a2035] mb-2">{title}</h3>

      {description && (
        <p className="text-sm text-[#64748b] max-w-xs leading-relaxed mb-6">{description}</p>
      )}

      {action && (
        <NeuButton variant="primary" onClick={action.onClick}>
          {action.label}
        </NeuButton>
      )}
    </div>
  )
}
