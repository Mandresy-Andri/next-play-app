import React from 'react'
import { NeuButton } from './NeuButton'
import { AlertTriangle } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onReset?: () => void
}

/**
 * Class-based React Error Boundary with a neumorphic error panel.
 * Wraps any subtree; on unhandled render error, shows a recovery UI.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Next Play] Unhandled render error:', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          className="flex flex-col items-center justify-center text-center py-16 px-8 min-h-[300px]"
          role="alert"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 bg-[#eef1f6] shadow-[6px_6px_12px_rgba(163,177,198,0.55),-6px_-6px_12px_rgba(255,255,255,0.85)] text-red-400">
            <AlertTriangle className="w-7 h-7" aria-hidden="true" />
          </div>
          <h3 className="text-base font-bold text-[#1a2035] mb-2">Something went wrong</h3>
          <p className="text-sm text-[#64748b] max-w-xs mb-6 leading-relaxed">
            An unexpected error occurred. Your data is safe — try refreshing this section.
          </p>
          {this.state.error?.message && (
            <p className="text-xs text-[#94a3b8] font-mono bg-[#e6e9f0] rounded-lg px-3 py-1.5 mb-6 max-w-sm truncate">
              {this.state.error.message}
            </p>
          )}
          <NeuButton variant="secondary" onClick={this.handleReset}>
            Try again
          </NeuButton>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Simpler inline error display for async/fetch errors — not a boundary.
 */
interface InlineErrorProps {
  message: string
  onRetry?: () => void
}

export function InlineError({ message, onRetry }: InlineErrorProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700"
      role="alert"
    >
      <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span className="text-sm font-medium flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold text-red-600 hover:text-red-800 underline-offset-2 hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  )
}
