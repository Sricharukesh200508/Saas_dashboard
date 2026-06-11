import React, { useState, useRef, useEffect } from 'react'
import { Card, Button, Badge } from '@/components/shared'
import { Activity, Send, Terminal, Play, RotateCcw } from 'lucide-react'
import { FadeIn } from '@/components/animations'
import { apiClient } from '@/api/client'

interface LogEntry {
  id: number
  time: string
  type: 'info' | 'success' | 'error' | 'request'
  message: string
  data?: any
}

export const MetricsTesterPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('')
  const [idempotencyKey, setIdempotencyKey] = useState('')
  const [endpoint, setEndpoint] = useState('/api/users')
  const [method, setMethod] = useState('GET')
  const [statusCode, setStatusCode] = useState(200)
  const [responseTime, setResponseTime] = useState(120)
  const [bytes, setBytes] = useState(1024)
  const [metadata, setMetadata] = useState('{"client": "web"}')
  
  const [logs, setLogs] = useState<LogEntry[]>([{
    id: 0, 
    time: new Date().toLocaleTimeString(), 
    type: 'info', 
    message: 'Metrics Ingest Tester initialized. Waiting for events...'
  }])
  const [isSending, setIsSending] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)

  const addLog = (type: LogEntry['type'], message: string, data?: any) => {
    setLogs(prev => [...prev, {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      type,
      message,
      data
    }])
  }

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)

    let parsedMetadata = null
    try {
      if (metadata.trim()) {
        parsedMetadata = JSON.parse(metadata)
      }
    } catch (e) {
      addLog('error', 'Invalid JSON in metadata field')
      setIsSending(false)
      return
    }

    const payload = {
      endpoint,
      method,
      status_code: statusCode,
      response_time_ms: responseTime,
      bytes_transferred: bytes,
      timestamp: new Date().toISOString(),
      metadata: parsedMetadata
    }

    addLog('request', `POST /api/v1/metrics/ingest`, payload)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      if (apiKey) headers['X-API-Key'] = apiKey
      if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey

      const response = await fetch('http://localhost:8000/api/v1/metrics/ingest', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      
      if (response.ok) {
        addLog('success', `[${response.status}] Event Accepted`, data)
      } else {
        addLog('error', `[${response.status}] Request Failed`, data)
      }
    } catch (err: any) {
      addLog('error', 'Network Error', err.message)
    } finally {
      setIsSending(false)
    }
  }

  const handleGenerateIdempotency = () => {
    setIdempotencyKey(`req_${Math.random().toString(36).substring(2, 11)}`)
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Metrics Ingest Tester</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Manually dispatch metric events to the backend ingestion API to test your alerts and analytics.</p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[500px]">
        {/* Left Side: Sender Form */}
        <FadeIn delay={0.1} className="h-full">
          <Card className="h-full">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="h-5 w-5 text-primary-400" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Event Payload Config</h3>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2 p-4 bg-error/5 border border-error/20 rounded-lg">
                <label className="text-sm font-medium text-error">X-API-Key Header (Required)</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="nx_live_xxxxxxxxx" 
                  className="input-field bg-white/5 border-error/30" 
                  required
                />
                <p className="text-xs text-error/70">The backend strictly validates this key.</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Idempotency-Key Header</label>
                  <button type="button" onClick={handleGenerateIdempotency} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" /> Generate
                  </button>
                </div>
                <input 
                  type="text" 
                  value={idempotencyKey}
                  onChange={(e) => setIdempotencyKey(e.target.value)}
                  placeholder="Optional unique ID to prevent duplicates" 
                  className="input-field" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Method</label>
                  <select value={method} onChange={(e) => setMethod(e.target.value)} className="input-field bg-[var(--bg-elevated)]">
                    <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Endpoint</label>
                  <input type="text" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} className="input-field" required />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Status Code</label>
                  <input type="number" value={statusCode} onChange={(e) => setStatusCode(Number(e.target.value))} className="input-field" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Latency (ms)</label>
                  <input type="number" value={responseTime} onChange={(e) => setResponseTime(Number(e.target.value))} className="input-field" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Bytes</label>
                  <input type="number" value={bytes} onChange={(e) => setBytes(Number(e.target.value))} className="input-field" required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">Metadata (JSON)</label>
                <textarea 
                  value={metadata} 
                  onChange={(e) => setMetadata(e.target.value)}
                  className="input-field font-mono text-xs h-20" 
                  placeholder='{"environment": "production"}'
                />
              </div>

              <div className="pt-4">
                <Button type="submit" fullWidth leftIcon={<Send className="h-4 w-4" />} loading={isSending}>
                  Dispatch Metric Event
                </Button>
              </div>
            </form>
          </Card>
        </FadeIn>

        {/* Right Side: Live Log */}
        <FadeIn delay={0.2} className="h-full">
          <Card className="h-full flex flex-col p-0 overflow-hidden bg-[#0A0A0B] border-[#1A1A1E]">
            <div className="bg-[#121214] border-b border-[#1A1A1E] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-[var(--text-muted)]" />
                <span className="text-sm font-medium text-[var(--text-secondary)]">Live Event Stream</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                <span className="text-xs text-[var(--text-muted)]">Connected</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4 space-y-3 font-mono text-xs h-[500px]">
              {logs.map((log) => (
                <div key={log.id} className="border-l-2 pl-3 py-1 border-opacity-50" style={{
                  borderColor: 
                    log.type === 'info' ? 'var(--text-muted)' : 
                    log.type === 'success' ? '#10b981' : 
                    log.type === 'error' ? '#ef4444' : '#3b82f6'
                }}>
                  <div className="flex items-start gap-2 text-[var(--text-muted)] mb-1">
                    <span className="shrink-0">[{log.time}]</span>
                    {log.type === 'request' && <span className="text-blue-400 font-semibold">&gt; REQUEST</span>}
                    {log.type === 'success' && <span className="text-green-400 font-semibold">&lt; RESPONSE</span>}
                    {log.type === 'error' && <span className="text-red-400 font-semibold">&lt; ERROR</span>}
                    <span className="text-[var(--text-primary)]">{log.message}</span>
                  </div>
                  {log.data && (
                    <pre className="mt-2 p-2 bg-black/40 rounded border border-white/5 text-[var(--text-secondary)] overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </Card>
        </FadeIn>
      </div>
    </div>
  )
}
