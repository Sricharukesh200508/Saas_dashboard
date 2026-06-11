// ────────────────────────────────────────────────────────────────
// Logger — No console.log in production
// ────────────────────────────────────────────────────────────────
const isDev = import.meta.env.VITE_ENVIRONMENT === 'development' || import.meta.env.DEV

export const logger = {
  info: (...args: unknown[]) => {
    if (isDev) console.info('[INFO]', ...args)
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn('[WARN]', ...args)
  },
  error: (...args: unknown[]) => {
    // Always log errors, even in production
    console.error('[ERROR]', ...args)
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.debug('[DEBUG]', ...args)
  },
}
