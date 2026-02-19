import Redis, { Redis as RedisType } from 'ioredis'

class MockRedis {
  private store = new Map<string, string>()
  private expiries = new Map<string, NodeJS.Timeout>()

  async get(key: string) {
    return this.store.get(key) || null
  }

  async set(key: string, value: string, mode?: string, duration?: number) {
    this.store.set(key, value)
    if (mode === 'EX' && duration) {
      this.expire(key, duration)
    }
    return 'OK'
  }

  async del(key: string) {
    const deleted = this.store.delete(key)
    return deleted ? 1 : 0
  }

  async incr(key: string) {
    const value = parseInt(this.store.get(key) || '0')
    const newValue = value + 1
    this.store.set(key, newValue.toString())
    return newValue
  }

  async pexpire(key: string, milliseconds: number) {
    if (this.expiries.has(key)) {
      clearTimeout(this.expiries.get(key)!)
    }
    const timeout = setTimeout(() => {
      this.store.delete(key)
      this.expiries.delete(key)
    }, milliseconds)
    this.expiries.set(key, timeout)
    return 1
  }

  async expire(key: string, seconds: number) {
    return this.pexpire(key, seconds * 1000)
  }

  async setex(key: string, seconds: number, value: string) {
    this.store.set(key, value)
    this.expire(key, seconds)
    return 'OK'
  }
}

const globalForRedis = globalThis as unknown as {
  redis: RedisType | MockRedis | undefined
}

const redisClient = () => {
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, {
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
    })
  }
  console.warn('WARN: Redis URL not found. Using in-memory mock Redis for development.')
  return new MockRedis() as unknown as RedisType
}

export const redis = globalForRedis.redis ?? redisClient()

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

export default redis

export const cacheKeys = {
  agent: (id: string) => `agent:${id}`,
  agentTools: (agentId: string) => `agent:${agentId}:tools`,
  session: (id: string) => `session:${id}`,
  sessionMessages: (sessionId: string) => `session:${sessionId}:messages`,
  rateLimit: (key: string) => `ratelimit:${key}`,
  workspace: (id: string) => `workspace:${id}`,
  providerKey: (workspaceId: string, provider: string) => `provider:${workspaceId}:${provider}`,
}

export const CACHE_TTL = {
  AGENT: 300,
  TOOLS: 300,
  SESSION: 600,
  MESSAGES: 300,
  RATE_LIMIT: 60,
  WORKSPACE: 600,
  PROVIDER_KEY: 300,
}
