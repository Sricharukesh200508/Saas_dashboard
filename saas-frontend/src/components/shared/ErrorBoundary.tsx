import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from './index'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-[var(--bg-base)] p-4 text-center">
          <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-8 shadow-glass">
            <div className="rounded-full bg-error/10 p-4 text-error">
              <AlertCircle size={48} />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Something went wrong</h1>
            <p className="text-[var(--text-secondary)]">
              An unexpected error occurred in the application. Please try refreshing the page.
            </p>
            {this.state.error && (
              <pre className="mt-4 w-full max-w-full overflow-auto rounded bg-[var(--bg-elevated)] p-4 text-left text-xs text-error">
                {this.state.error.message}
              </pre>
            )}
            <Button
              className="mt-4"
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
            >
              Refresh Page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
