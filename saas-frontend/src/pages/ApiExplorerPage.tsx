import React, { useState } from 'react'
import { Card, Button, Badge } from '@/components/shared'
import { Play, BookOpen, Key, Terminal, Braces } from 'lucide-react'
import { FadeIn } from '@/components/animations'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { toast } from '@/components/shared/Toast'

const ENDPOINTS = [
  { id: 'get-users', method: 'GET', path: '/api/v1/users', description: 'List all users in the workspace.' },
  { id: 'post-users', method: 'POST', path: '/api/v1/users', description: 'Create a new user.' },
  { id: 'get-metrics', method: 'GET', path: '/api/v1/metrics/summary', description: 'Get aggregated metric summary.' },
]

export const ApiExplorerPage: React.FC = () => {
  const [activeEndpoint, setActiveEndpoint] = useState(ENDPOINTS[0])
  const [apiKey, setApiKey] = useLocalStorage('nexus_test_api_key', '')
  const [response, setResponse] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = () => {
    if (!apiKey) {
      toast.error('Missing API Key', 'Please enter your API Key to authenticate the request.')
      return
    }

    setIsLoading(true)
    setResponse(null)

    // Simulate API Call
    setTimeout(() => {
      setIsLoading(false)
      if (apiKey !== 'test_key') {
        // Just mock a success for any key that is at least 10 chars, else error
        if (apiKey.length < 10) {
          setResponse({
            status: 401,
            data: { error: 'Unauthorized', message: 'Invalid API Key format. Must be at least 10 characters.' }
          })
          toast.error('Request Failed', '401 Unauthorized')
          return
        }
      }

      // Mock Success Response based on endpoint
      if (activeEndpoint.id === 'get-users') {
        setResponse({
          status: 200,
          data: { users: [{ id: 'u_1', email: 'admin@test.com' }, { id: 'u_2', email: 'dev@test.com' }] }
        })
      } else if (activeEndpoint.id === 'post-users') {
        setResponse({
          status: 201,
          data: { id: 'u_new', email: 'new@test.com', status: 'created' }
        })
      } else {
        setResponse({
          status: 200,
          data: { total_requests: 12500, error_rate: 0.05, avg_latency_ms: 124 }
        })
      }
      toast.success('Request Successful', '200 OK')
    }, 800)
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">API Explorer</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Read the documentation and test API endpoints directly from your browser.</p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[600px]">
        {/* Left Side: Endpoints & Docs */}
        <FadeIn delay={0.1} className="lg:col-span-4 h-full">
          <Card className="h-full flex flex-col p-0 overflow-hidden">
            <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-2 bg-[var(--bg-elevated)]">
              <BookOpen className="h-4 w-4 text-primary-400" />
              <h3 className="font-semibold text-[var(--text-primary)]">Endpoints</h3>
            </div>
            <div className="flex-1 overflow-auto p-2 space-y-1">
              {ENDPOINTS.map(ep => (
                <button
                  key={ep.id}
                  onClick={() => { setActiveEndpoint(ep); setResponse(null); }}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activeEndpoint.id === ep.id ? 'bg-primary-500/10 border border-primary-500/20' : 'hover:bg-[var(--bg-elevated)] border border-transparent'}`}
                >
                  <Badge variant={ep.method === 'GET' ? 'info' : 'success'} className="w-14 justify-center">{ep.method}</Badge>
                  <div className="truncate">
                    <div className="text-sm font-mono text-[var(--text-primary)]">{ep.path}</div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </FadeIn>

        {/* Right Side: Playground */}
        <FadeIn delay={0.2} className="lg:col-span-8 h-full">
          <Card className="h-full flex flex-col p-0 overflow-hidden">
            <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Badge variant={activeEndpoint.method === 'GET' ? 'info' : 'success'}>{activeEndpoint.method}</Badge>
                <span className="font-mono text-[var(--text-primary)]">{activeEndpoint.path}</span>
              </div>
              <Button size="sm" leftIcon={<Play className="h-4 w-4" />} onClick={handleSend} loading={isLoading}>
                Send Request
              </Button>
            </div>

            <div className="p-4 border-b border-[var(--border-color)] space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">{activeEndpoint.description}</p>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                  <Key className="h-4 w-4 text-[var(--text-muted)]" /> Authentication (Bearer Token)
                </label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your API key here (sk_test_...)" 
                  className="input-field max-w-md" 
                />
              </div>

              {activeEndpoint.method === 'POST' && (
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                    <Braces className="h-4 w-4 text-[var(--text-muted)]" /> Request Body (JSON)
                  </label>
                  <textarea 
                    className="input-field font-mono text-xs h-24 bg-[#0A0A0B]" 
                    defaultValue={'{\n  "email": "user@example.com"\n}'}
                  />
                </div>
              )}
            </div>

            <div className="flex-1 bg-[#0A0A0B] p-4 overflow-auto border-t border-[#1A1A1E]">
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="h-4 w-4 text-[var(--text-muted)]" />
                <span className="text-sm font-medium text-[var(--text-secondary)]">Response</span>
                {response && (
                  <Badge variant={response.status >= 400 ? 'error' : 'success'} className="ml-auto">
                    {response.status} {response.status >= 400 ? 'Error' : 'OK'}
                  </Badge>
                )}
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : response ? (
                <pre className="font-mono text-xs text-[var(--text-primary)] whitespace-pre-wrap">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              ) : (
                <div className="text-center text-[var(--text-muted)] py-12 text-sm">
                  Hit "Send Request" to see the response.
                </div>
              )}
            </div>
          </Card>
        </FadeIn>
      </div>
    </div>
  )
}
