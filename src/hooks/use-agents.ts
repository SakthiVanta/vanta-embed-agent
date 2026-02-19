'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Agent, ApiResponse } from '@/types'

interface UseAgentsReturn {
    agents: Agent[]
    isLoading: boolean
    error: string | null
    refetch: () => Promise<void>
    deleteAgent: (id: string) => Promise<boolean>
}

export function useAgents(workspaceId: string | null): UseAgentsReturn {
    const [agents, setAgents] = useState<Agent[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchAgents = useCallback(async () => {
        if (!workspaceId) {
            setAgents([])
            return
        }

        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch(`/api/agents?workspaceId=${workspaceId}`)
            const data: ApiResponse<{ agents: Agent[] }> = await response.json()

            if (response.ok && data.data) {
                setAgents(data.data.agents)
            } else {
                setError(data.error || 'Failed to fetch agents')
            }
        } catch (err) {
            setError('Failed to fetch agents')
            console.error('Error fetching agents:', err)
        } finally {
            setIsLoading(false)
        }
    }, [workspaceId])

    const deleteAgent = useCallback(async (agentId: string): Promise<boolean> => {
        if (!workspaceId) return false

        try {
            const response = await fetch(
                `/api/agents?id=${agentId}&workspaceId=${workspaceId}`,
                { method: 'DELETE' }
            )

            if (response.ok) {
                setAgents(prev => prev.filter(a => a.id !== agentId))
                return true
            }
            return false
        } catch (err) {
            console.error('Error deleting agent:', err)
            return false
        }
    }, [workspaceId])

    useEffect(() => {
        fetchAgents()
    }, [fetchAgents])

    return {
        agents,
        isLoading,
        error,
        refetch: fetchAgents,
        deleteAgent,
    }
}
