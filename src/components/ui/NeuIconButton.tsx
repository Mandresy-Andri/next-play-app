import React from 'react'
import { cn } from '@/lib/cn'
import { motion, type HTMLMotionProps } from 'framer-motion'

type IconButtonSize = 'sm' | 'md' | 'lg'
type IconButtonVariant = 'default' | 'primary' | 'ghost'

interface NeuIconButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  icon: React.ReactNode
  label: string        // Always required for accessibility
  size?: IconButtonSize
  variant?: IconButtonVariant
  active?: boolean
}

const sizeMap: Record<IconButtonSize, string> = {
  sm: 'w-8 h-8 rounded-[10px]',
  md: 'w-10 h-10 rounded-[12px]',
  lg: 'w-12 h-12 rounded-[14px]',
}

const iconSizeMap: Record<IconButtonSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

export const NeuIconButton = React.forwardRef<HTMLButtonElement, NeuIconButtonProps>(
  ({ icon, label, size = 'md', variant = 'default', active, className, ...props }, ref) => {
    const base = active
      ? 'bg-[#e0e5ed] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.6),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] text-blue-500'
      : variant === 'primary'
        ? 'bg-blue-500 text-white shadow-[3px_3px_6px_rgba(37,99,235,0.35),-2px_-2px_4px_rgba(255,255,255,0.5)] hover:bg-blue-600'
        : variant === 'ghost'
          ? 'bg-transparent text-[#64748b] hover:bg-[#eef1f6] hover:shadow-[3px_3px_6px_rgba(163,177,198,0.4),-3px_-3px_6px_rgba(255,255,255,0.6)]'
          : 'bg-[#eef1f6] text-[#374156] shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.8)] hover:shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.8)]'

    return (
      <motion.button
        ref={ref}
        aria-label={label}
        title={label}
        whileTap={{ scale: 0.93 }}
        transition={{ duration: 0.1 }}
        className={cn(
          'inline-flex items-center justify-center shrink-0',
          'transition-all duration-150',
          'focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'cursor-pointer',
          sizeMap[size],
          base,
          className
        )}
        {...props}
      >
        <span className={iconSizeMap[size]} aria-hidden="true">
          {icon}
        </span>
      </motion.button>
    )
  }
)
NeuIconButton.displayName = 'NeuIconButton'
