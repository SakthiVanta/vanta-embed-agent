'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, MessageSquare, Zap, Users, TrendingUp, DollarSign, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AnalyticsData {
  totalMessages: number
  messageChange: string
  activeSessions: number
  sessionChange: string
  toolExecutions: number
  toolChange: string
  estimatedCost: string
  topAgents: Array<{
    id: string
    name: string
    messages: number
    tools: number
  }>
  messageVolume: Array<{
    date: string
    count: number
  }>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [workspace, setWorkspace] = useState<{id: string} | null>(null)

  useEffect(() => {
    const ws = localStorage.getItem('workspace')
    if (ws) {
      const parsed = JSON.parse(ws)
      setWorkspace(parsed)
      fetchAnalytics(parsed.id)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchAnalytics = async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/analytics?workspaceId=${workspaceId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAnalytics(data.data)
        }
      } else {
        toast.error('Failed to load analytics data')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  const data = analytics || {
    totalMessages: 0,
    messageChange: '0',
    activeSessions: 0,
    sessionChange: '0',
    toolExecutions: 0,
    toolChange: '0',
    estimatedCost: '0.00',
    topAgents: [],
    messageVolume: [],
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Track your agents&apos; performance and usage metrics
        </p>
      </div>

      {/* Stats Grid - REAL DATA */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Messages"
          value={data.totalMessages.toLocaleString()}
          change={`${parseInt(data.messageChange) >= 0 ? '+' : ''}${data.messageChange}%`}
          icon={<MessageSquare className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          title="Active Sessions"
          value={data.activeSessions.toString()}
          change={`${parseInt(data.sessionChange) >= 0 ? '+' : ''}${data.sessionChange}%`}
          icon={<Users className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          title="Tool Executions"
          value={data.toolExecutions.toLocaleString()}
          change={`${parseInt(data.toolChange) >= 0 ? '+' : ''}${data.toolChange}%`}
          icon={<Zap className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          title="Est. Cost"
          value={`$${data.estimatedCost}`}
          change="This month"
          icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Message Volume (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.messageVolume.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-muted-foreground">No data yet</p>
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-end gap-1">
                {data.messageVolume.map((day, idx) => {
                  const maxCount = Math.max(...data.messageVolume.map(d => d.count))
                  const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0
                  return (
                    <div
                      key={idx}
                      className="flex-1 bg-emerald-500 rounded-t hover:bg-emerald-600 transition-colors relative group"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {day.date}: {day.count} messages
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Token Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-muted-foreground">Token tracking coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Agents - REAL DATA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Performing Agents</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topAgents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No agents with activity yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.topAgents.map((agent, i) => (
                <div key={agent.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="font-medium">{agent.name}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span>{agent.messages.toLocaleString()} messages</span>
                    <span>{agent.tools} tool calls</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  change,
  icon,
}: {
  title: string
  value: string
  change: string
  icon: React.ReactNode
}) {
  const isPositive = change.startsWith('+')
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            {icon}
          </div>
        </div>
        <p className={`text-xs mt-2 ${isPositive ? 'text-emerald-600' : change === 'This month' ? 'text-muted-foreground' : 'text-red-600'}`}>
          {change}
        </p>
      </CardContent>
    </Card>
  )
}
