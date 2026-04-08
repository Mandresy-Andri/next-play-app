import { cn } from '@/lib/cn'

interface NeuSkeletonProps {
  className?: string
  /** Number of rows to render */
  rows?: number
  /** Animate shimmer effect */
  animate?: boolean
}

/**
 * Neumorphic skeleton loader. Inset surface with a shimmer sweep.
 */
export function NeuSkeleton({ className, rows = 1, animate = true }: NeuSkeletonProps) {
  if (rows > 1) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <NeuSkeleton key={i} className={className} animate={animate} />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden',
        'bg-[#e6e9f0]',
        'shadow-[inset_2px_2px_5px_rgba(163,177,198,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]',
        'h-4 w-full',
        animate && 'relative',
        className
      )}
      aria-hidden="true"
      role="presentation"
    >
      {animate && (
        <div
          className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)',
          }}
        />
      )}
    </div>
  )
}

/**
 * Pre-built skeleton for a task card shape
 */
export function NeuCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 bg-[#eef1f6] shadow-[6px_6px_12px_rgba(163,177,198,0.6),-6px_-6px_12px_rgba(255,255,255,0.8)]"
      aria-hidden="true"
    >
      <NeuSkeleton className="h-4 w-3/4 mb-3" />
      <NeuSkeleton className="h-3 w-1/2 mb-5" />
      <div className="flex items-center justify-between">
        <NeuSkeleton className="h-5 w-16 rounded-full" />
        <NeuSkeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
  )
}
