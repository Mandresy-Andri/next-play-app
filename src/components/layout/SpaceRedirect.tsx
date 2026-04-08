import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useSpaces } from '@/hooks/useSpaces'
import { NeuCardSkeleton } from '@/components/ui/NeuSkeleton'

/**
 * On app boot, redirect to the first available space.
 * If the list is empty (possible race with trigger on new account),
 * retry once after a short delay before giving up.
 */
export function SpaceRedirect() {
  const { data: spaces, isLoading, refetch } = useSpaces()
  const [retried, setRetried] = useState(false)

  useEffect(() => {
    // If loaded but empty — wait for trigger to finish, then retry once
    if (!isLoading && spaces && spaces.length === 0 && !retried) {
      const timer = setTimeout(() => {
        setRetried(true)
        refetch()
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [isLoading, spaces, retried, refetch])

  if (isLoading || (!retried && spaces?.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#eef1f6]">
        <div className="w-80 flex flex-col gap-4">
          <NeuCardSkeleton />
          <NeuCardSkeleton />
        </div>
      </div>
    )
  }

  if (spaces && spaces.length > 0) {
    return <Navigate to={`/s/${spaces[0].id}`} replace />
  }

  // Still empty after retry — go to auth
  return <Navigate to="/auth" replace />
}
