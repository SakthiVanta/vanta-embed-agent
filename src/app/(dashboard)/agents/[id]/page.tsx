'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bot,
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  MessageSquare,
  Wrench,
  Settings,
  BarChart3,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from 'sonner'
import { EditAgentModal } from '@/components/dashboard/edit-agent-modal'
import { getApiKeys } from '@/app/actions'

interface Agent {
  id: string
  name: string
  description?: string
  isActive: boolean
  isPublic: boolean
  provider: string
  model: string
  systemPrompt: string
  temperature: number
  maxTokens: number
  memoryEnabled: boolean
  contextWindow: number
  uiMode: string
  allowedDomains: string[]
  requireAuth: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    sessions: number
    tools: number
  }
}

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string

  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [workspace, setWorkspace] = useState<{ id: string } | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    const ws = localStorage.getItem('workspace')
    if (ws) {
      const parsedWs = JSON.parse(ws)
      setWorkspace(parsedWs)
      fetchAgentData(parsedWs.id)
    } else {
      fetchAgentData()
    }
  }, [agentId])

  const fetchAgentData = async (wsId?: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}`)
      if (response.ok) {
        const data = await response.json()
        setAgent(data.agent)
      } else {
        toast.error('Agent not found')
        router.push('/agents')
        return
      }

      if (wsId) {
        const keysRes = await getApiKeys(wsId)
        if (keysRes.success && keysRes.keys && keysRes.keys.length > 0) {
          // Assuming key field is returned containing the raw or display key
          setApiKey(keysRes.keys[0].key || keysRes.keys[0].displayKey)
        }
      }

    } catch (error) {
      console.error('Error fetching agent:', error)
      toast.error('Failed to load agent data')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(agentId)
    toast.success('Agent ID copied to clipboard')
  }

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Code copied to clipboard')
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/agents?id=${agentId}&workspaceId=${workspace?.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Agent deleted successfully')
        router.push('/agents')
      } else {
        throw new Error('Failed to delete')
      }
    } catch (error) {
      toast.error('Failed to delete agent')
    }
  }

  const getEmbedCode = () => {
    return `import { VantaAgent } from 'vanta-agent-embed-sdk';

function App() {
  return (
    <VantaAgent 
      agentId="${agentId}"
      ${apiKey ? `apiKey="${showApiKey ? apiKey : 'vk_...'}"` : '// Add your API key here'}
      type="floating" // 'floating' | 'embedded' | 'fullpage'
      position="bottom-right" 
    />
  );
}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Bot className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-lg font-semibold">Agent not found</h2>
        <Link href="/agents">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Agents
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/agents">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{agent.name}</h2>
              <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                {agent.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {agent.isPublic && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">Public</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {agent.description || 'No description'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyId}>
            <Copy className="w-4 h-4 mr-2" />
            Copy ID
          </Button>
          <EditAgentModal agent={agent} workspaceId={workspace?.id || ''}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </EditAgentModal>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Conversations</span>
            </div>
            <p className="text-2xl font-bold">{agent._count?.sessions || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Wrench className="w-4 h-4" />
              <span className="text-sm">Tools</span>
            </div>
            <p className="text-2xl font-bold">{agent._count?.tools || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Bot className="w-4 h-4" />
              <span className="text-sm">Model</span>
            </div>
            <p className="text-lg font-bold truncate">{agent.model}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Settings className="w-4 h-4" />
              <span className="text-sm">Provider</span>
            </div>
            <p className="text-lg font-bold">{agent.provider}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="embed">Embed Code</TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>The instructions given to the AI agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{agent.systemPrompt}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Temperature</span>
                  <span className="font-medium">{agent.temperature}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Tokens</span>
                  <span className="font-medium">{agent.maxTokens}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Context Window</span>
                  <span className="font-medium">{agent.contextWindow} messages</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Memory Enabled</span>
                  <span className="font-medium">{agent.memoryEnabled ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Require Auth</span>
                  <span className="font-medium">{agent.requireAuth ? 'Yes' : 'No'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Visual customized settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Avatar URL</span>
                  <span className="font-medium truncate max-w-[200px]" title={(agent as any).avatarUrl}>
                    {(agent as any).avatarUrl || 'Default'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Primary Color</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{(agent as any).theme?.primaryColor || 'Default'}</span>
                    {(agent as any).theme?.primaryColor && <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: (agent as any).theme.primaryColor }} />}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Background Color</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{(agent as any).theme?.backgroundColor || 'Default'}</span>
                    {(agent as any).theme?.backgroundColor && <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: (agent as any).theme.backgroundColor }} />}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Text Color</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{(agent as any).theme?.textColor || 'Default'}</span>
                    {(agent as any).theme?.textColor && <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: (agent as any).theme.textColor }} />}
                  </div>
                </div>
                {(agent as any).theme?.welcomeMessage && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Welcome Message</span>
                    <span className="font-medium truncate max-w-[200px]" title={(agent as any).theme.welcomeMessage}>{(agent as any).theme.welcomeMessage}</span>
                  </div>
                )}
                {(agent as any).theme?.mood && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Mood Context</span>
                    <span className="font-medium truncate max-w-[200px]" title={(agent as any).theme.mood}>{(agent as any).theme.mood}</span>
                  </div>
                )}
                {(agent as any).theme?.fontFamily && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Font</span>
                    <span className="font-medium truncate max-w-[200px]" title={(agent as any).theme.fontFamily}>{(agent as any).theme.fontFamily}</span>
                  </div>
                )}
                {(agent as any).theme?.supportEmail && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Support Email</span>
                    <span className="font-medium truncate max-w-[200px]" title={(agent as any).theme.supportEmail}>{(agent as any).theme.supportEmail}</span>
                  </div>
                )}
                {(agent as any).theme?.contactLink && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Contact Link</span>
                    <span className="font-medium truncate max-w-[200px]" title={(agent as any).theme.contactLink}>{(agent as any).theme.contactLink}</span>
                  </div>
                )}
                {(agent as any).theme?.logoUrl && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Logo URL</span>
                    <span className="font-medium truncate max-w-[200px]" title={(agent as any).theme.logoUrl}>{(agent as any).theme.logoUrl}</span>
                  </div>
                )}
                {Array.isArray((agent as any).theme?.suggestions) && (agent as any).theme.suggestions.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Suggestions</span>
                    <span className="font-medium truncate max-w-[200px] text-xs" title={JSON.stringify((agent as any).theme.suggestions)}>
                      {JSON.stringify((agent as any).theme.suggestions)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Allowed Domains</CardTitle>
                <CardDescription>Domains where this agent can be embedded</CardDescription>
              </CardHeader>
              <CardContent>
                {agent.allowedDomains.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No domain restrictions (all domains allowed)</p>
                ) : (
                  <div className="space-y-2">
                    {agent.allowedDomains.map((domain, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        {domain}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">Agent ID</span>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono text-sm bg-slate-50 dark:bg-slate-900 border p-2 rounded flex-1">{agent.id}</p>
                    <Button variant="outline" size="icon" onClick={() => handleCopyCode(agent.id)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm text-muted-foreground">Workspace API Key</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowApiKey(!showApiKey)} className="h-6">
                      {showApiKey ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                      {showApiKey ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono text-sm bg-slate-50 dark:bg-slate-900 border p-2 rounded flex-1">
                      {apiKey ? (showApiKey ? apiKey : 'vk_••••••••••••••••••••••••') : 'No active API Key found in workspace.'}
                    </p>
                    <Button variant="outline" size="icon" onClick={() => apiKey && handleCopyCode(apiKey)} disabled={!apiKey}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <span className="text-sm text-muted-foreground">UI Mode</span>
                  <p className="font-medium">{agent.uiMode}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Created</span>
                  <p className="font-medium">{new Date(agent.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="embed">
          <Card>
            <CardHeader>
              <CardTitle>Embed Code (React / Next.js)</CardTitle>
              <CardDescription>Install the package and use the component in your project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              <div className="space-y-2">
                <h4 className="font-medium text-sm">1. Install Package</h4>
                <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto relative group">
                  <p>npm install vanta-agent-embed-sdk</p>
                  <Button size="icon" variant="ghost" className="absolute top-2 right-2 hidden group-hover:flex h-8 w-8 text-slate-300 hover:text-white" onClick={() => handleCopyCode("npm install vanta-agent-embed-sdk")}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-sm">2. Add Component Code</h4>
                  <Button variant="ghost" size="sm" onClick={() => setShowApiKey(!showApiKey)} className="h-6 -mb-2">
                    {showApiKey ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                    {showApiKey ? 'Hide Key in Code' : 'Show Key in Code'}
                  </Button>
                </div>
                <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto whitespace-pre relative group">
                  {getEmbedCode()}
                  <Button size="icon" variant="ghost" className="absolute top-2 right-2 hidden group-hover:flex h-8 w-8 text-slate-300 hover:text-white" onClick={() => handleCopyCode(getEmbedCode())}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-slate-100 dark:bg-slate-900 border rounded-lg p-4">
                <h5 className="font-medium mb-2">Environment Variables Option</h5>
                <p className="text-sm text-muted-foreground">
                  If you prefer not to hardcode the API key, you can set <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">NEXT_PUBLIC_VANTA_API_KEY</code>, <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">VITE_VANTA_API_KEY</code>, or <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">VANTA_API_KEY</code> in your environment, and simply pass <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">&lt;VantaAgent agentId="{agentId}" /&gt;</code> to auto-configure securely.
                </p>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="font-medium">Analytics Coming Soon</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Detailed analytics for this agent will be available here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
