import React from 'react'
import { cn } from '@/lib/cn'

interface NeuInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  /** Full-width wrapper */
  fullWidth?: boolean
}

export const NeuInput = React.forwardRef<HTMLInputElement, NeuInputProps>(
  ({ label, error, hint, leftIcon, rightIcon, fullWidth, className, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-[#374156] uppercase tracking-wider pl-1"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-[#94a3b8] pointer-events-none flex items-center">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              // Neumorphic inset style
              'w-full bg-[#e8ecf2] rounded-[12px] text-[#1a2035] text-sm font-medium',
              'shadow-[inset_3px_3px_6px_rgba(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.8)]',
              'placeholder:text-[#94a3b8]',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-400/50',
              'focus:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.8),0_0_0_2px_rgba(96,165,250,0.3)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon  ? 'pl-10 pr-4 py-2.5' : 'px-4 py-2.5',
              rightIcon ? 'pr-10' : '',
              error && 'ring-2 ring-red-400/60',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 text-[#94a3b8] flex items-center">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-500 pl-1" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-xs text-[#94a3b8] pl-1">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
NeuInput.displayName = 'NeuInput'
