import React from 'react'
import { cn } from '@/lib/cn'

type BadgeVariant = 'default' | 'blue' | 'green' | 'amber' | 'red' | 'slate'

interface NeuBadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
  style?: React.CSSProperties
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#e2e8f0] text-[#374156]',
  blue:    'bg-blue-100  text-blue-700',
  green:   'bg-emerald-100 text-emerald-700',
  amber:   'bg-amber-100  text-amber-700',
  red:     'bg-red-100    text-red-700',
  slate:   'bg-slate-100  text-slate-600',
}

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#94a3b8]',
  blue:    'bg-blue-500',
  green:   'bg-emerald-500',
  amber:   'bg-amber-500',
  red:     'bg-red-500',
  slate:   'bg-slate-400',
}

export function NeuBadge({ children, variant = 'default', size = 'sm', dot, className, style }: NeuBadgeProps) {
  return (
    <span
      style={style}
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-full',
        size === 'sm' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1',
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn('rounded-full shrink-0', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2', dotStyles[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
