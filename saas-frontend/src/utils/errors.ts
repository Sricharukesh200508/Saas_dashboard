import type { AxiosError } from 'axios'

// ────────────────────────────────────────────────────────────────
// Error extraction utility
// ────────────────────────────────────────────────────────────────
export function extractErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (!error) return fallback

  if (typeof error === 'string') return error

  const axiosError = error as AxiosError<{ detail?: string; message?: string }>
  if (axiosError.response?.data) {
    const data = axiosError.response.data
    if (typeof data.detail === 'string') return data.detail
    if (typeof data.message === 'string') return data.message
    if (typeof data === 'string') return data
  }

  if (axiosError.message) return axiosError.message

  const err = error as Error
  if (err.message) return err.message

  return fallback
}

export function isNetworkError(error: unknown): boolean {
  const e = error as AxiosError
  return e.code === 'ERR_NETWORK' || e.code === 'ECONNABORTED' || !e.response
}

export function isAuthError(error: unknown): boolean {
  const e = error as AxiosError
  return e.response?.status === 401
}

export function isForbiddenError(error: unknown): boolean {
  const e = error as AxiosError
  return e.response?.status === 403
}

export function isRateLimitError(error: unknown): boolean {
  const e = error as AxiosError
  return e.response?.status === 429
}
