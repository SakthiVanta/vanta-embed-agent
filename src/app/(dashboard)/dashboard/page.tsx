'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bot, MessageSquare, Zap, TrendingUp, Plus, ArrowUpRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface RealStats {
  totalAgents: number
  agentTrend: string
  totalMessages: number
  messageTrend: string
  totalToolCalls: number
  toolSuccessRate: string
  avgResponseTime: string
}

interface Agent {
  id: string
  name: string
  description?: string
  isActive: boolean
  _count?: {
    sessions: number
  }
  updatedAt: string
  model: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<RealStats>({
    totalAgents: 0,
    agentTrend: '0 this week',
    totalMessages: 0,
    messageTrend: '0%',
    totalToolCalls: 0,
    toolSuccessRate: '0% success',
    avgResponseTime: '0s',
  })
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [workspace, setWorkspace] = useState<{id: string, name: string, tier: string} | null>(null)

  useEffect(() => {
    const ws = localStorage.getItem('workspace')
    if (ws) {
      const parsed = JSON.parse(ws)
      setWorkspace(parsed)
      fetchDashboardData(parsed.id)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchDashboardData = async (wsId: string) => {
    try {
      const [agentsRes, statsRes] = await Promise.all([
        fetch(`/api/agents?workspaceId=${wsId}`),
        fetch(`/api/workspaces/stats?workspaceId=${wsId}`),
      ])

      if (agentsRes.ok) {
        const agentsData = await agentsRes.json()
        const agentsList = agentsData.data?.agents || []
        setAgents(agentsList.slice(0, 5))
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        if (statsData.success && statsData.data) {
          setStats(statsData.data)
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    return `${days}d`
  }

  const getModelBadge = (model: string) => {
    if (model.includes('gpt-4')) return <Badge variant="secondary" className="text-xs">GPT-4</Badge>
    if (model.includes('claude')) return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">Claude</Badge>
    if (model.includes('gemini')) return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Gemini</Badge>
    return <Badge variant="secondary" className="text-xs">{model.split('-')[0]}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Dashboard</h2>
          <p className="text-xs text-muted-foreground">
            Welcome back! Here&apos;s your workspace overview
          </p>
        </div>
        <Link href="/agents/new">
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8">
            <Plus className="w-4 h-4 mr-1" />
            New Agent
          </Button>
        </Link>
      </div>

      {/* Stats Grid - REAL DATA */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="AI Agents"
          value={stats.totalAgents.toString()}
          description="Active agents"
          icon={<Bot className="w-3.5 h-3.5 text-emerald-600" />}
          trend={stats.agentTrend}
        />
        <StatCard
          title="Messages"
          value={stats.totalMessages.toLocaleString()}
          description="This month"
          icon={<MessageSquare className="w-3.5 h-3.5 text-emerald-600" />}
          trend={stats.messageTrend}
        />
        <StatCard
          title="Tool Calls"
          value={stats.totalToolCalls.toLocaleString()}
          description="Successful"
          icon={<Zap className="w-3.5 h-3.5 text-emerald-600" />}
          trend={stats.toolSuccessRate}
        />
        <StatCard
          title="Avg Response"
          value={stats.avgResponseTime}
          description="Response time"
          icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
          trend=""
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Agents List */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Your Agents</CardTitle>
                <CardDescription className="text-xs">
                  Manage and monitor your AI agents
                </CardDescription>
              </div>
              <Link href="/agents">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  View All
                  <ArrowUpRight className="ml-1 w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {agents.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Bot className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <h3 className="font-medium text-sm text-slate-900">No agents yet</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  Create your first AI agent to get started
                </p>
                <Link href="/agents/new">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Create Agent
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {agents.map((agent) => (
                  <Link 
                    key={agent.id} 
                    href={`/agents/${agent.id}`}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${agent.isActive ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                        <Bot className={`w-4 h-4 ${agent.isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{agent.name}</span>
                          {getModelBadge(agent.model)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {agent._count?.sessions || 0} conversations · Updated {formatTimeAgo(agent.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={agent.isActive ? 'default' : 'secondary'} className="text-xs">
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Status */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/agents/new">
                <Button variant="outline" className="w-full justify-start h-9 text-sm">
                  <Bot className="mr-2 w-4 h-4" />
                  Create New Agent
                </Button>
              </Link>
              <Link href="/tools">
                <Button variant="outline" className="w-full justify-start h-9 text-sm">
                  <Zap className="mr-2 w-4 h-4" />
                  Add Custom Tool
                </Button>
              </Link>
              <Link href="/providers">
                <Button variant="outline" className="w-full justify-start h-9 text-sm">
                  <TrendingUp className="mr-2 w-4 h-4" />
                  Configure Providers
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Plan Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm">Current Plan</span>
                <Badge className="bg-emerald-600">{workspace?.tier || 'FREE'}</Badge>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Agents</span>
                  <span>{stats.totalAgents} / {workspace?.tier === 'PRO' ? 20 : workspace?.tier === 'STARTER' ? 5 : 1}</span>
                </div>
                <div className="flex justify-between">
                  <span>Messages</span>
                  <span>{stats.totalMessages.toLocaleString()}</span>
                </div>
              </div>
              <Link href="/billing">
                <Button variant="outline" size="sm" className="w-full mt-4 h-8 text-xs">
                  Manage Billing
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  description, 
  icon,
  trend 
}: { 
  title: string
  value: string
  description: string
  icon: React.ReactNode
  trend?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            {icon}
          </div>
          {trend && (
            <span className="text-xs text-emerald-600 font-medium">{trend}</span>
          )}
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
