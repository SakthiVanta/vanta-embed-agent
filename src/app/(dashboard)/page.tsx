'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bot, MessageSquare, Zap, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { ActivityItem } from '@/components/dashboard/activity-item'
import { AgentRow } from '@/components/dashboard/agent-row'
import { CreateAgentModal } from '@/components/dashboard/create-agent-modal'
import { CreateToolModal } from '@/components/dashboard/create-tool-modal'
import { formatTimeAgo } from '@/lib/format'

interface Stats {
  totalAgents: number
  totalMessages: number
  totalToolCalls: number
  avgResponseTime: string
}

interface RecentActivity {
  id: string
  title: string
  time: string
  agent: string
}

interface Agent {
  id: string
  name: string
  isActive: boolean
  _count?: {
    sessions: number
  }
  updatedAt: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalAgents: 0,
    totalMessages: 0,
    totalToolCalls: 0,
    avgResponseTime: '0s',
  })
  const [agents, setAgents] = useState<Agent[]>([])
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [workspaceId, setWorkspaceId] = useState<string>('')

  useEffect(() => {
    const workspace = localStorage.getItem('workspace')
    if (workspace) {
      const ws = JSON.parse(workspace)
      setWorkspaceId(ws.id)
      fetchDashboardData(ws.id)
    }
  }, [])

  const fetchDashboardData = async (wsId: string) => {
    try {
      // Fetch agents
      const agentsRes = await fetch(`/api/agents?workspaceId=${wsId}`)
      const agentsData = await agentsRes.json()

      if (agentsRes.ok) {
        setAgents(agentsData.agents.slice(0, 3))
        setStats(prev => ({ ...prev, totalAgents: agentsData.agents.length }))
      }

      // For now, use mock stats - these would come from an analytics API
      setStats(prev => ({
        ...prev,
        totalMessages: 1250,
        totalToolCalls: 892,
        avgResponseTime: '1.2s',
      }))

      // Mock activities
      setActivities([
        { id: '1', title: 'New conversation started', time: '2 minutes ago', agent: 'Customer Support Bot' },
        { id: '2', title: 'Tool executed successfully', time: '5 minutes ago', agent: 'Sales Assistant' },
        { id: '3', title: 'Agent configuration updated', time: '1 hour ago', agent: 'FAQ Bot' },
      ])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your agents.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Agents"
          value={stats.totalAgents.toString()}
          description="Active agents"
          icon={<Bot className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          title="Messages"
          value={stats.totalMessages.toLocaleString()}
          description="This month"
          icon={<MessageSquare className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          title="Tool Calls"
          value={stats.totalToolCalls.toLocaleString()}
          description="Successful executions"
          icon={<Zap className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          title="Avg. Response"
          value={stats.avgResponseTime}
          description="Response time"
          icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-2">
              <CreateAgentModal workspaceId={workspaceId} />
              <CreateToolModal agents={agents} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  title={activity.title}
                  time={activity.time}
                  agent={activity.agent}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Your Agents</CardTitle>
          <Link href="/agents">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Bot className="w-4 h-4 mr-2" />
              New Agent
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading agents...</div>
          ) : agents.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="font-medium text-slate-900">No agents yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first AI agent to get started
              </p>
              <Link href="/agents">
                <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Agent
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {agents.map((agent) => (
                <AgentRow
                  key={agent.id}
                  name={agent.name}
                  status={agent.isActive ? 'active' : 'inactive'}
                  conversations={(agent._count?.sessions || 0).toString()}
                  lastActive={formatTimeAgo(agent.updatedAt)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


