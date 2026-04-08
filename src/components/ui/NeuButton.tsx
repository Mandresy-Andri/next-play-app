import React from 'react'
import { cn } from '@/lib/cn'
import { motion, type HTMLMotionProps } from 'framer-motion'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface NeuButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-blue-500 text-white',
    'shadow-[4px_4px_8px_rgba(37,99,235,0.35),-2px_-2px_6px_rgba(255,255,255,0.5)]',
    'hover:bg-blue-600 hover:shadow-[6px_6px_12px_rgba(37,99,235,0.4),-2px_-2px_6px_rgba(255,255,255,0.4)]',
    'active:shadow-[inset_2px_2px_5px_rgba(37,99,235,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.3)]',
    'active:scale-[0.98]',
  ].join(' '),

  secondary: [
    'bg-[#eef1f6] text-[#374156]',
    'shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.8)]',
    'hover:shadow-[6px_6px_12px_rgba(163,177,198,0.6),-6px_-6px_12px_rgba(255,255,255,0.8)]',
    'active:shadow-[inset_2px_2px_5px_rgba(163,177,198,0.6),inset_-2px_-2px_5px_rgba(255,255,255,0.8)]',
    'active:scale-[0.98]',
  ].join(' '),

  ghost: [
    'bg-transparent text-[#374156]',
    'shadow-none',
    'hover:bg-[#eef1f6] hover:shadow-[3px_3px_6px_rgba(163,177,198,0.4),-3px_-3px_6px_rgba(255,255,255,0.6)]',
    'active:shadow-[inset_1px_1px_3px_rgba(163,177,198,0.5),inset_-1px_-1px_3px_rgba(255,255,255,0.7)]',
    'active:scale-[0.98]',
  ].join(' '),

  danger: [
    'bg-red-500 text-white',
    'shadow-[4px_4px_8px_rgba(239,68,68,0.35),-2px_-2px_6px_rgba(255,255,255,0.5)]',
    'hover:bg-red-600',
    'active:shadow-[inset_2px_2px_5px_rgba(239,68,68,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.3)]',
    'active:scale-[0.98]',
  ].join(' '),
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-[10px]',
  md: 'h-10 px-4 text-sm gap-2 rounded-[12px]',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-[14px]',
}

export const NeuButton = React.forwardRef<HTMLButtonElement, NeuButtonProps>(
  ({ variant = 'secondary', size = 'md', isLoading, leftIcon, rightIcon, children, className, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          'inline-flex items-center justify-center font-semibold',
          'transition-all duration-150',
          'focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'select-none cursor-pointer',
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    )
  }
)
NeuButton.displayName = 'NeuButton'
