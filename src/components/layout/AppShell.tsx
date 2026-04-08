import React, { useState, useCallback } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutGrid, BarChart2, Plus, Search, LogOut, User, Users,
  ChevronRight, X, Menu, Zap, AlertCircle, Settings,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuth } from '@/providers/useAuth'
import { NeuIconButton, NeuAvatar, NeuBadge, NeuSkeleton } from '@/components/ui'
import { useSpaces } from '@/hooks/useSpaces'
import { useMyProfile } from '@/hooks/useProfile'
import { displayNameOf } from '@/lib/displayName'
import { NewSpaceModal } from '@/components/board/NewSpaceModal'
import { ManageLabelsModal } from '@/components/tasks/ManageLabelsModal'

/* ─── Sidebar ─────────────────────────────────────────────────────────────── */
interface SidebarProps {
  onClose?: () => void
  isMobile?: boolean
}

function Sidebar({ onClose, isMobile }: SidebarProps) {
  const { spaceId } = useParams<{ spaceId: string }>()
  const navigate = useNavigate()
  const { user, isAnonymous, signOut } = useAuth()
  const { data: spaces = [], isLoading: spacesLoading, isError: spacesError } = useSpaces()
  const { data: profile } = useMyProfile()
  const [newSpaceOpen, setNewSpaceOpen] = useState(false)
  const [labelsModalOpen, setLabelsModalOpen] = useState(false)

  const displayName = displayNameOf({
    displayName: profile?.display_name,
    email: user?.email,
    isAnonymous,
    fallback: 'You',
  })

  const handleSignOut = useCallback(async () => {
    await signOut()
    navigate('/auth')
  }, [signOut, navigate])

  const handleSpaceCreated = useCallback((id: string) => {
    navigate(`/s/${id}`)
  }, [navigate])

  return (
    <>
      <aside
        className={cn(
          'flex flex-col h-full',
          'bg-[#eef1f6]',
          !isMobile && 'shadow-[6px_0_20px_rgba(163,177,198,0.3)]',
          'w-64 shrink-0'
        )}
      >
        {/* Logo + close button (mobile) */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-[#dde2ec]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center shadow-[3px_3px_6px_rgba(37,99,235,0.35),-2px_-2px_4px_rgba(255,255,255,0.6)]">
              <Zap className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <span className="font-bold text-[#1a2035] text-base tracking-tight">Next Play Board</span>
          </div>
          {isMobile && (
            <NeuIconButton icon={<X />} label="Close sidebar" size="sm" variant="ghost" onClick={onClose} />
          )}
        </div>

        {/* Search will be implemented in the future*/}
        {/* <div className="px-4 py-3">
          <div
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-xl',
              'bg-[#e6e9f0]',
              'shadow-[inset_2px_2px_5px_rgba(163,177,198,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]',
              'cursor-pointer transition-all duration-150',
              'hover:shadow-[inset_3px_3px_7px_rgba(163,177,198,0.55),inset_-3px_-3px_7px_rgba(255,255,255,0.75)]'
            )}
            role="button"
            tabIndex={0}
            aria-label="Search tasks"
          >
            <Search className="w-3.5 h-3.5 text-[#94a3b8]" aria-hidden="true" />
            <span className="text-xs text-[#94a3b8] font-medium">Search tasks…</span>
            <kbd className="ml-auto text-[10px] text-[#94a3b8] font-mono bg-[#eef1f6] rounded px-1.5 py-0.5 shadow-[1px_1px_2px_rgba(163,177,198,0.4)]">
              ⌘K
            </kbd>
          </div>
        </div> */}

        {/* Spaces */}
        <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Spaces navigation">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Spaces</span>
            <NeuIconButton
              icon={<Plus />}
              label="Create new space"
              size="sm"
              variant="ghost"
              onClick={() => setNewSpaceOpen(true)}
            />
          </div>

          {/* Loading skeleton */}
          {spacesLoading && (
            <div className="flex flex-col gap-1.5 px-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <NeuSkeleton className="w-2.5 h-2.5 rounded-full shrink-0" />
                  <NeuSkeleton className="h-3.5 flex-1 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {spacesError && !spacesLoading && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-red-500">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Failed to load spaces
            </div>
          )}

          {/* Spaces list */}
          {!spacesLoading && !spacesError && (
            <ul role="list" className="flex flex-col gap-1">
              {spaces.map(space => (
                <li key={space.id}>
                  <NavLink
                    to={`/s/${space.id}`}
                    className={({ isActive }) => cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold',
                      'transition-all duration-150 group',
                      isActive || spaceId === space.id
                        ? 'bg-[#e0e5ed] text-[#1a2035] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.8)]'
                        : 'text-[#374156] hover:bg-[#e8ecf2] hover:shadow-[inset_1px_1px_3px_rgba(163,177,198,0.3),inset_-1px_-1px_3px_rgba(255,255,255,0.6)]'
                    )}
                    aria-current={spaceId === space.id ? 'page' : undefined}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: space.color }}
                      aria-hidden="true"
                    />
                    <span className="flex-1 truncate">
                      {space.icon && <span className="mr-1.5" aria-hidden="true">{space.icon}</span>}
                      {space.name}
                    </span>
                  </NavLink>

                  {/* Sub-nav for active space */}
                  {spaceId === space.id && (
                    <ul className="mt-1 ml-5 flex flex-col gap-0.5" role="list">
                      {[
                        { to: `/s/${space.id}`, icon: LayoutGrid, label: 'Board' },
                        { to: `/s/${space.id}/stats`, icon: BarChart2, label: 'Stats' },
                        { to: `/s/${space.id}/team`, icon: Users, label: 'Team' },
                      ].map(item => (
                        <li key={item.label}>
                          <NavLink
                            to={item.to}
                            end
                            className={({ isActive }) => cn(
                              'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium',
                              'transition-all duration-150',
                              isActive
                                ? 'text-blue-600 bg-blue-50'
                                : 'text-[#64748b] hover:text-[#374156] hover:bg-[#e8ecf2]'
                            )}
                          >
                            <item.icon className="w-3.5 h-3.5" aria-hidden="true" />
                            {item.label}
                          </NavLink>
                        </li>
                      ))}
                      <li>
                        <button
                          onClick={() => setLabelsModalOpen(true)}
                          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs font-medium text-[#64748b] hover:text-[#374156] hover:bg-[#e8ecf2] transition-all duration-150"
                        >
                          <Settings className="w-3.5 h-3.5" aria-hidden="true" />
                          Labels
                        </button>
                      </li>
                    </ul>
                  )}
                </li>
              ))}

              {/* Empty state */}
              {spaces.length === 0 && (
                <li className="px-3 py-4 text-center">
                  <p className="text-xs text-[#94a3b8] font-medium mb-2">No spaces yet</p>
                  <button
                    onClick={() => setNewSpaceOpen(true)}
                    className="text-xs text-blue-500 font-semibold hover:text-blue-600 transition-colors"
                  >
                    Create your first space
                  </button>
                </li>
              )}
            </ul>
          )}
        </nav>

        {/* Guest upgrade nudge */}
        {isAnonymous && (
          <div className="mx-3 mb-2">
            <button
              onClick={() => navigate('/auth?mode=upgrade')}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold',
                'bg-amber-50 text-amber-700 border border-amber-200/60',
                'hover:bg-amber-100 transition-colors duration-150'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" aria-hidden="true" />
              Guest — save your work
            </button>
          </div>
        )}

        {/* User footer */}
        <div className="border-t border-[#dde2ec] px-4 py-4">
          <div className="flex items-center gap-3">
            <NeuAvatar name={displayName} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1a2035] truncate">{displayName}</p>
              {isAnonymous && (
                <NeuBadge variant="amber" dot size="sm">Guest</NeuBadge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <NeuIconButton
                icon={<User />}
                label="Edit profile"
                size="sm"
                variant="ghost"
                onClick={() => navigate('/profile')}
                title="Profile"
              />
              <NeuIconButton
                icon={<LogOut />}
                label="Sign out"
                size="sm"
                variant="ghost"
                onClick={handleSignOut}
              />
            </div>
          </div>
        </div>
      </aside>

      <NewSpaceModal
        open={newSpaceOpen}
        onClose={() => setNewSpaceOpen(false)}
        onCreated={handleSpaceCreated}
      />

      {spaceId && (
        <ManageLabelsModal
          open={labelsModalOpen}
          onClose={() => setLabelsModalOpen(false)}
          spaceId={spaceId}
        />
      )}
    </>
  )
}

/* ─── TopBar ──────────────────────────────────────────────────────────────── */
interface TopBarProps {
  title?: string
  subtitle?: string
  onMenuClick: () => void
  actions?: React.ReactNode
}

export function TopBar({ title, subtitle, onMenuClick, actions }: TopBarProps) {
  return (
    <header
      className={cn(
        'flex items-center gap-4 px-6 py-4',
        'bg-[#eef1f6]',
        'border-b border-[#dde2ec]',
        'shadow-[0_2px_8px_rgba(163,177,198,0.25)]',
        'z-10 shrink-0'
      )}
    >
      <NeuIconButton
        icon={<Menu />}
        label="Toggle sidebar"
        size="sm"
        variant="ghost"
        className="lg:hidden"
        onClick={onMenuClick}
      />

      <div className="flex-1 min-w-0">
        {title && (
          <div className="flex items-center gap-2">
            {subtitle && (
              <>
                <span className="text-xs text-[#94a3b8] font-medium hidden sm:inline">{subtitle}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#cbd5e1] hidden sm:block" aria-hidden="true" />
              </>
            )}
            <h1 className="text-sm font-bold text-[#1a2035] truncate">{title}</h1>
          </div>
        )}
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}

/* ─── AppShell ────────────────────────────────────────────────────────────── */
interface AppShellProps {
  children: React.ReactNode
  topBarTitle?: string
  topBarSubtitle?: string
  topBarActions?: React.ReactNode
}

export function AppShell({ children, topBarTitle, topBarSubtitle, topBarActions }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = useCallback(() => setMobileOpen(false), [])
  const openMobile  = useCallback(() => setMobileOpen(true),  [])

  return (
    <div className="flex h-screen overflow-hidden bg-[#eef1f6]">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-[#1a2035]/30 backdrop-blur-sm lg:hidden"
              onClick={closeMobile}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <Sidebar onClose={closeMobile} isMobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          title={topBarTitle}
          subtitle={topBarSubtitle}
          onMenuClick={openMobile}
          actions={topBarActions}
        />
        <main className="flex-1 overflow-auto" id="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}
