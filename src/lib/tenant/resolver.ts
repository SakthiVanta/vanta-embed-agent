import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import redis, { cacheKeys, CACHE_TTL } from '@/lib/redis'

export interface TenantContext {
  workspaceId: string
  agentId: string
  origin: string | null
  isValid: boolean
  error?: string
}

export const resolveTenant = async (
  agentId: string,
  requestOrigin?: string
): Promise<TenantContext> => {
  try {
    const cached = await redis.get(cacheKeys.agent(agentId))
    let agent: any

    if (cached) {
      agent = JSON.parse(cached)
    } else {
      agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: {
          workspace: true,
        },
      })

      if (agent) {
        await redis.setex(
          cacheKeys.agent(agentId),
          CACHE_TTL.AGENT,
          JSON.stringify(agent)
        )
      }
    }

    if (!agent) {
      return {
        workspaceId: '',
        agentId,
        origin: requestOrigin || null,
        isValid: false,
        error: 'Agent not found',
      }
    }

    if (!agent.isActive) {
      return {
        workspaceId: agent.workspaceId,
        agentId,
        origin: requestOrigin || null,
        isValid: false,
        error: 'Agent is not active',
      }
    }

    if (agent.workspace.status !== 'ACTIVE') {
      return {
        workspaceId: agent.workspaceId,
        agentId,
        origin: requestOrigin || null,
        isValid: false,
        error: 'Workspace is not active',
      }
    }

    const headersList = await headers()
    const origin = requestOrigin || headersList.get('origin') || null

    if (origin && agent.allowedDomains.length > 0) {
      const originHostname = new URL(origin).hostname
      const isAllowed = agent.allowedDomains.some((domain: string) => {
        if (domain.startsWith('*.')) {
          const suffix = domain.slice(2)
          return originHostname.endsWith(suffix)
        }
        return originHostname === domain
      })

      if (!isAllowed) {
        return {
          workspaceId: agent.workspaceId,
          agentId,
          origin,
          isValid: false,
          error: 'Domain not allowed',
        }
      }
    }

    return {
      workspaceId: agent.workspaceId,
      agentId,
      origin,
      isValid: true,
    }
  } catch (error) {
    return {
      workspaceId: '',
      agentId,
      origin: requestOrigin || null,
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export const getWorkspaceConfig = async (workspaceId: string) => {
  const cached = await redis.get(cacheKeys.workspace(workspaceId))
  
  if (cached) {
    return JSON.parse(cached)
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  })

  if (workspace) {
    await redis.setex(
      cacheKeys.workspace(workspaceId),
      CACHE_TTL.WORKSPACE,
      JSON.stringify(workspace)
    )
  }

  return workspace
}
