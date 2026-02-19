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
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

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
  const [workspace, setWorkspace] = useState<{id: string} | null>(null)

  useEffect(() => {
    const ws = localStorage.getItem('workspace')
    if (ws) {
      setWorkspace(JSON.parse(ws))
    }
    fetchAgentData()
  }, [agentId])

  const fetchAgentData = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}`)
      if (response.ok) {
        const data = await response.json()
        setAgent(data.agent)
      } else {
        toast.error('Agent not found')
        router.push('/agents')
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
    return `<script src="${window.location.origin}/embed/${agentId}.js"></script>`
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
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
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
                  <p className="font-mono text-sm bg-slate-50 dark:bg-slate-900 p-2 rounded mt-1">{agent.id}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">UI Mode</span>
                  <p className="font-medium">{agent.uiMode}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Created</span>
                  <p className="font-medium">{new Date(agent.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <p className="font-medium">{new Date(agent.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="embed">
          <Card>
            <CardHeader>
              <CardTitle>Embed Code</CardTitle>
              <CardDescription>Add this script to your website to embed the agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                {getEmbedCode()}
              </div>
              <Button onClick={() => {
                navigator.clipboard.writeText(getEmbedCode())
                toast.success('Embed code copied!')
              }}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </Button>
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
