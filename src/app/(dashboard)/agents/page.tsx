'use client'

import { useState } from 'react'
import { Button, Card, CardContent, CardHeader, Input } from '@/components'
import { CreateAgentModal } from '@/components/dashboard/create-agent-modal'
import { useWorkspace, useAgents } from '@/hooks'
import { Bot, Plus, Search, Edit, Trash2, Copy, MessageSquare, Wrench } from 'lucide-react'
import type { Agent } from '@/types'

export default function AgentsPage() {
  const { workspaceId } = useWorkspace()
  const { agents, isLoading, refetch, deleteAgent } = useAgents(workspaceId)
  const [searchQuery, setSearchQuery] = useState('')

  const handleDelete = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return
    const success = await deleteAgent(agentId)
    if (!success) {
      alert('Failed to delete agent')
    }
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
  }

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agents</h2>
          <p className="text-muted-foreground">
            Manage your AI agents and their configurations
          </p>
        </div>
        <CreateAgentModal workspaceId={workspaceId ?? ''}>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            New Agent
          </Button>
        </CreateAgentModal>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search agents..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading agents...</div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="font-medium text-slate-900">No agents found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first agent to get started
              </p>
              <CreateAgentModal workspaceId={workspaceId ?? ''}>
                <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Agent
                </Button>
              </CreateAgentModal>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{agent.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${agent.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                          }`}>
                          {agent.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {agent.isPublic && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                            Public
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {agent.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Wrench className="w-3 h-3" />
                          {agent._count?.tools || 0} tools
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {agent._count?.sessions || 0} conversations
                        </span>
                        <span>{agent.provider} / {agent.model}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyId(agent.id)}
                      title="Copy Agent ID"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(agent.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
