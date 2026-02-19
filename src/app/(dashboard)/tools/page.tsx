'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Wrench, Plus, Search, Edit, Trash2, Link, Code, Globe, Bot } from 'lucide-react'
import { CreateToolModal } from '@/components/dashboard/create-tool-modal'

interface Tool {
  id: string
  name: string
  description: string
  type: 'REST_API' | 'CLIENT_BRIDGE' | 'CUSTOM_CODE'
  method?: string
  endpoint?: string
  isActive: boolean
  requiresConfirmation: boolean
}

const typeIcons = {
  REST_API: Globe,
  CLIENT_BRIDGE: Link,
  CUSTOM_CODE: Code,
}

const typeLabels = {
  REST_API: 'REST API',
  CLIENT_BRIDGE: 'Client Bridge',
  CUSTOM_CODE: 'Custom Code',
}

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [agents, setAgents] = useState<{ id: string, name: string }[]>([])

  useEffect(() => {
    const workspace = localStorage.getItem('workspace')
    if (workspace) {
      const ws = JSON.parse(workspace)
      fetchAgents(ws.id)
    }
  }, [])

  const fetchAgents = async (wsId: string) => {
    try {
      const response = await fetch(`/api/agents?workspaceId=${wsId}`)
      const data = await response.json()
      if (response.ok && data.data?.agents?.length > 0) {
        setAgents(data.data.agents)
        setSelectedAgentId(data.data.agents[0].id)
        fetchTools(data.data.agents[0].id)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
      setLoading(false)
    }
  }

  const fetchTools = async (agentId: string) => {
    try {
      const response = await fetch(`/api/tools?agentId=${agentId}`)
      const data = await response.json()
      if (response.ok && data.data) {
        setTools(data.data.tools)
      }
    } catch (error) {
      console.error('Error fetching tools:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAgentChange = (agentId: string) => {
    setSelectedAgentId(agentId)
    fetchTools(agentId)
  }

  const handleDelete = async (toolId: string) => {
    if (!confirm('Are you sure you want to delete this tool?')) return

    try {
      const response = await fetch(`/api/tools?id=${toolId}&agentId=${selectedAgentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTools(tools.filter(t => t.id !== toolId))
      }
    } catch (error) {
      console.error('Error deleting tool:', error)
    }
  }

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tools</h2>
          <p className="text-muted-foreground">
            Manage tools that extend your agents&apos; capabilities
          </p>
        </div>
        <CreateToolModal agents={agents}>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Tool
          </Button>
        </CreateToolModal>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search tools..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {agents.length > 0 && (
              <select
                value={selectedAgentId}
                onChange={(e) => handleAgentChange(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm bg-background"
              >
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="font-medium text-slate-900">Create an agent first</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You need to create an agent before adding tools
              </p>
            </div>
          ) : loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading tools...</div>
          ) : filteredTools.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="font-medium text-slate-900">No tools found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add tools to extend your agent&apos;s capabilities
              </p>
              <CreateToolModal agents={agents}>
                <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tool
                </Button>
              </CreateToolModal>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTools.map((tool) => {
                const TypeIcon = typeIcons[tool.type]
                return (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                        <TypeIcon className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{tool.name}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${tool.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                            }`}>
                            {tool.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {tool.requiresConfirmation && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">
                              Requires Confirmation
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {tool.description}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{typeLabels[tool.type]}</span>
                          {tool.method && <span>{tool.method}</span>}
                          {tool.endpoint && <span className="truncate max-w-[200px]">{tool.endpoint}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(tool.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
