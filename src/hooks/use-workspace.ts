'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Workspace } from '@/types'

interface UseWorkspaceReturn {
    workspace: Workspace | null
    workspaceId: string | null
    isLoading: boolean
    error: string | null
    refetch: () => void
}

export function useWorkspace(): UseWorkspaceReturn {
    const [workspace, setWorkspace] = useState<Workspace | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadWorkspace = useCallback(() => {
        try {
            setIsLoading(true)
            setError(null)

            const workspaceData = localStorage.getItem('workspace')
            if (workspaceData) {
                const ws = JSON.parse(workspaceData) as Workspace
                setWorkspace(ws)
            }
        } catch (err) {
            setError('Failed to load workspace')
            console.error('Error loading workspace:', err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadWorkspace()
    }, [loadWorkspace])

    return {
        workspace,
        workspaceId: workspace?.id ?? null,
        isLoading,
        error,
        refetch: loadWorkspace,
    }
}
