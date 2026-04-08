import { cn } from '@/lib/cn'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg'

interface NeuAvatarProps {
  name?: string
  src?: string
  size?: AvatarSize
  className?: string
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
}

/** Deterministic hue from a name string */
function nameToHue(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function NeuAvatar({ name = 'Guest', src, size = 'md', className }: NeuAvatarProps) {
  const hue = nameToHue(name)
  const initials = getInitials(name)

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center shrink-0 font-semibold select-none',
        'shadow-[2px_2px_4px_rgba(163,177,198,0.5),-2px_-2px_4px_rgba(255,255,255,0.8)]',
        sizeStyles[size],
        className
      )}
      style={
        src
          ? { backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : {
              background: `hsl(${hue}, 60%, 88%)`,
              color: `hsl(${hue}, 55%, 35%)`,
            }
      }
      aria-label={name}
      role="img"
      title={name}
    >
      {!src && initials}
    </div>
  )
}
