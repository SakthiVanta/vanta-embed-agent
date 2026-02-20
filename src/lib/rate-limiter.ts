import { Ratelimit } from '@upstash/ratelimit'
import { redis } from './redis'

interface RateLimitConfig {
  requests: number
  window: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  requests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100'),
  window: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
}

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig = DEFAULT_CONFIG) {
    this.config = config
  }

  async check(key: string): Promise<{ success: boolean; remaining: number; reset: number }> {
    const now = Date.now()
    const windowStart = Math.floor(now / this.config.window) * this.config.window
    const redisKey = `ratelimit:${key}:${windowStart}`

    try {
      const current = await redis.incr(redisKey)

      if (current === 1) {
        await redis.pexpire(redisKey, this.config.window)
      }

      const remaining = Math.max(0, this.config.requests - current)
      const reset = windowStart + this.config.window

      return {
        success: current <= this.config.requests,
        remaining,
        reset,
      }
    } catch (error) {
      console.error('RateLimiter: Redis error, bypassing rate limit.', error)
      return {
        success: true, // Fail open to keep app working when Redis is down
        remaining: this.config.requests,
        reset: now + this.config.window
      }
    }
  }

  async checkWorkspace(workspaceId: string): Promise<{ success: boolean; remaining: number; reset: number }> {
    return this.check(`workspace:${workspaceId}`)
  }

  async checkAgent(agentId: string, ip?: string): Promise<{ success: boolean; remaining: number; reset: number }> {
    const key = ip ? `agent:${agentId}:ip:${ip}` : `agent:${agentId}`
    return this.check(key)
  }

  async checkSession(sessionId: string): Promise<{ success: boolean; remaining: number; reset: number }> {
    return this.check(`session:${sessionId}`)
  }
}

export const rateLimiter = new RateLimiter()
