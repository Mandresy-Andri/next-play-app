import React from 'react'
import { cn } from '@/lib/cn'
import { motion, type HTMLMotionProps } from 'framer-motion'

interface NeuCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  /** Slightly more prominent shadow for interactive cards */
  interactive?: boolean
  /** Sunken inset variant for wells / input backgrounds */
  inset?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingStyles = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-7',
}

export const NeuCard = React.forwardRef<HTMLDivElement, NeuCardProps>(
  ({ interactive, inset, padding = 'md', children, className, ...props }, ref) => {
    const base = inset
      ? 'bg-[#e6e9f0] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)]'
      : 'bg-[#eef1f6] shadow-[6px_6px_12px_rgba(163,177,198,0.6),-6px_-6px_12px_rgba(255,255,255,0.8)]'

    return (
      <motion.div
        ref={ref}
        whileHover={interactive ? { y: -2, transition: { duration: 0.18 } } : undefined}
        className={cn(
          'rounded-2xl',
          base,
          paddingStyles[padding],
          interactive && 'cursor-pointer transition-shadow duration-200 hover:shadow-[8px_8px_16px_rgba(163,177,198,0.65),-8px_-8px_16px_rgba(255,255,255,0.85)]',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
NeuCard.displayName = 'NeuCard'
