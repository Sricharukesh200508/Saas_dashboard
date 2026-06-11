import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY, THEME_STORAGE_KEY } from './constants'
import type { Token } from '@/types/auth'
import type { Theme } from '@/types/ui'
import { logger } from './logger'

// ────────────────────────────────────────────────────────────────
// Generic typed storage helpers
// ────────────────────────────────────────────────────────────────
export function getItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    logger.warn(`Failed to parse storage key: ${key}`)
    return null
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    logger.warn(`Failed to set storage key: ${key}`)
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    logger.warn(`Failed to remove storage key: ${key}`)
  }
}

// ── Domain-specific helpers ──────────────────────────────────────
export function getStoredTokens(): Token | null {
  return getItem<Token>(TOKEN_STORAGE_KEY)
}

export function storeTokens(tokens: Token): void {
  setItem(TOKEN_STORAGE_KEY, tokens)
}

export function clearTokens(): void {
  removeItem(TOKEN_STORAGE_KEY)
}

export function getStoredTheme(): Theme | null {
  return getItem<Theme>(THEME_STORAGE_KEY)
}

export function storeTheme(theme: Theme): void {
  setItem(THEME_STORAGE_KEY, theme)
}

export function clearAuthStorage(): void {
  removeItem(TOKEN_STORAGE_KEY)
  removeItem(USER_STORAGE_KEY)
}
