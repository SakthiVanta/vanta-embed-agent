'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, MessageSquare, Zap, Users, TrendingUp, DollarSign } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Track your agents&apos; performance and usage metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Messages"
          value="12.5K"
          change="+23%"
          icon={<MessageSquare className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          title="Active Sessions"
          value="48"
          change="+12%"
          icon={<Users className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          title="Tool Executions"
          value="892"
          change="+45%"
          icon={<Zap className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          title="Est. Cost"
          value="$23.50"
          change="This month"
          icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* Charts Placeholder */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Message Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-muted-foreground">Chart coming soon</p>
              </div>
            </div>
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
                <p className="text-sm text-muted-foreground">Chart coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Agents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Performing Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Customer Support Bot', messages: 5234, tools: 234 },
              { name: 'Sales Assistant', messages: 3891, tools: 156 },
              { name: 'FAQ Bot', messages: 2156, tools: 89 },
            ].map((agent, i) => (
              <div key={i} className="flex items-center justify-between">
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
        <p className="text-xs text-emerald-600 mt-2">{change}</p>
      </CardContent>
    </Card>
  )
}
