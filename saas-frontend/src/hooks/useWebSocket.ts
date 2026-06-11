import { useEffect, useRef, useCallback } from 'react'
import { API_CONFIG } from '@/config/api.config'
import { useAuthStore } from '@/store/auth.store'
import { useMetricsStore } from '@/store/metrics.store'
import { logger } from '@/utils/logger'
import type { LiveMetricEvent } from '@/types/metrics'

const MAX_RECONNECT_ATTEMPTS = 8
const BASE_RECONNECT_DELAY = 1000

// ────────────────────────────────────────────────────────────────
// useWebSocket — with exponential backoff reconnection
// ────────────────────────────────────────────────────────────────
export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { tenant_id, tokens, isAuthenticated } = useAuthStore()
  const { addLiveEvent, setWsConnected, setWsReconnecting } = useMetricsStore()

  const connect = useCallback(() => {
    if (!isAuthenticated || !tenant_id || !tokens?.access_token) return

    const wsUrl = `${API_CONFIG.WS_URL}/live-metrics/${tenant_id}?token=${tokens.access_token}`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        logger.info('WebSocket connected')
        reconnectAttemptsRef.current = 0
        setWsConnected(true)
        setWsReconnecting(false)
        // Send auth message if needed, but our backend might just read the token from headers or we pass via query param if we update backend.
        // Actually, the current backend websocket endpoint doesn't require tenant_id in URL, it just checks token. Wait, our backend websocket endpoint might need token.
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as LiveMetricEvent
          addLiveEvent(data)
        } catch {
          logger.warn('Failed to parse WS message:', event.data)
        }
      }

      ws.onclose = () => {
        logger.info('WebSocket disconnected')
        setWsConnected(false)
        wsRef.current = null

        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(
            BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
            30000,
          )
          reconnectAttemptsRef.current += 1
          setWsReconnecting(true)
          logger.info(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`)
          reconnectTimeoutRef.current = setTimeout(connect, delay)
        } else {
          setWsReconnecting(false)
          logger.warn('Max WS reconnect attempts reached.')
        }
      }

      ws.onerror = () => {
        logger.warn('WebSocket error')
      }
    } catch {
      logger.warn('WebSocket unavailable')
    }
  }, [isAuthenticated, tenant_id, tokens, addLiveEvent, setWsConnected, setWsReconnecting])

  useEffect(() => {
    if (isAuthenticated) {
      connect()
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [isAuthenticated, connect])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    }
  }, [])

  return { disconnect }
}
