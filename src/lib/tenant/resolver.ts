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
    let agent: any = null

    // 1. Try Redis lookup
    try {
      const cached = await redis.get(cacheKeys.agent(agentId))
      if (cached) {
        agent = JSON.parse(cached)
      }
    } catch (redisError) {
      console.warn('resolveTenant: Redis error during lookup, falling back to database.', redisError)
    }

    // 2. Database lookup if not in cache or Redis failed
    if (!agent) {
      agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: {
          workspace: true,
        },
      })

      if (agent) {
        // Attempt to cache
        try {
          await redis.setex(
            cacheKeys.agent(agentId),
            CACHE_TTL.AGENT,
            JSON.stringify(agent)
          )
        } catch (redisError) {
          console.warn('resolveTenant: Redis error during caching.', redisError)
        }
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
    console.error('resolveTenant: Fatal error:', error)
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
  try {
    const cached = await redis.get(cacheKeys.workspace(workspaceId))
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (redisError) {
    console.warn('getWorkspaceConfig: Redis error, falling back to database.', redisError)
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  })

  if (workspace) {
    try {
      await redis.setex(
        cacheKeys.workspace(workspaceId),
        CACHE_TTL.WORKSPACE,
        JSON.stringify(workspace)
      )
    } catch (redisError) {
      // Ignore caching errors
    }
  }

  return workspace
}
