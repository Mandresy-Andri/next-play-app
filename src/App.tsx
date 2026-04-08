import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider } from '@/providers/AuthProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import { ToastProvider } from '@/providers/ToastProvider'
import { ErrorBoundary } from '@/components/ui'
import { NeuCardSkeleton } from '@/components/ui/NeuSkeleton'
import { SpaceRedirect } from '@/components/layout/SpaceRedirect'

// Lazy-load route chunks for lean initial bundle
const BoardPage   = React.lazy(() => import('@/pages/BoardPage'))
const StatsPage   = React.lazy(() => import('@/pages/StatsPage'))
const AuthPage    = React.lazy(() => import('@/pages/AuthPage'))
const ProfilePage = React.lazy(() => import('@/pages/ProfilePage'))
const TeamPage    = React.lazy(() => import('@/pages/TeamPage'))

/** Full-screen loading shell used while lazy chunks resolve */
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#eef1f6]">
      <div className="w-80 flex flex-col gap-4">
        <NeuCardSkeleton />
        <NeuCardSkeleton />
        <NeuCardSkeleton />
      </div>
    </div>
  )
}

/** Wraps routes with a subtle fade+slide transition */
function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <Routes location={location}>
          {/* Default redirect — picks first available space */}
          <Route path="/" element={<SpaceRedirect />} />

          {/* Space routes */}
          <Route path="/s/:spaceId" element={<BoardPage />} />
          <Route path="/s/:spaceId/stats" element={<StatsPage />} />
          <Route path="/s/:spaceId/team" element={<TeamPage />} />

          {/* Account */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* Auth */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <AnimatedRoutes />
              </Suspense>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  )
}
