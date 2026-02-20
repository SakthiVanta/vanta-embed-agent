import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import redis, { cacheKeys, CACHE_TTL } from '@/lib/redis'
import { resolveTenant } from '@/lib/tenant/resolver'
import { ProviderFactory } from '@/lib/providers'
import { createEncryptionService } from '@/lib/security/encryption'
import { ToolRegistry, ToolExecutor } from '@/lib/tools/executor'
import { validateChatMessage, sanitizeToolOutput } from '@/lib/tools/validators'
import { StreamController, createSSEStream } from '@/lib/streaming/controller'
import { rateLimiter } from '@/lib/rate-limiter'
import { v4 as uuidv4 } from 'uuid'

// Custom Chat Services
import { authenticateChatRequest } from '@/lib/chat/auth'
import { getOrCreateChatSession, saveUserMessage, saveAssistantMessage, logUsageMetrics } from '@/lib/chat/session'
import { buildSystemPrompt, buildMessageHistory } from '@/lib/chat/prompt'
import { executeToolCall } from '@/lib/chat/tools'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateChatMessage(body)

    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
    }

    const { agentId, sessionId: providedSessionId, message, visitorId, visitorEmail } = validation.data
    const origin = request.headers.get('origin') || ''
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || ''

    console.log(`[POST /api/chat] Incoming request for agent ${agentId}`)

    // 1. Authentication & Tenant Resolution
    const { apiKeyWorkspaceId } = await authenticateChatRequest(request.headers.get('authorization'))
    const tenant = await resolveTenant(agentId, origin || undefined)

    if (apiKeyWorkspaceId) {
      const agentCheck = await prisma.agent.findUnique({ where: { id: agentId }, select: { workspaceId: true } })
      if (agentCheck?.workspaceId !== apiKeyWorkspaceId) return NextResponse.json({ error: 'API Key workspace mismatch' }, { status: 403 })
    } else if (!tenant.isValid) {
      return NextResponse.json({ success: false, error: tenant.error || 'Invalid tenant' }, { status: 403 })
    }

    // 2. Rate Limiting
    const rateLimit = await rateLimiter.checkAgent(agentId, ip)
    if (!rateLimit.success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    // 3. Agent & Provider Initialization
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { tools: { where: { isActive: true } } },
    })

    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    const providerKey = await prisma.providerKey.findFirst({
      where: { workspaceId: tenant.workspaceId, provider: agent.provider, isActive: true },
      orderBy: { isDefault: 'desc' },
    })

    if (!providerKey) return NextResponse.json({ error: 'No API key configured' }, { status: 500 })

    const provider = ProviderFactory.createProvider(agent.provider, {
      apiKey: createEncryptionService().decrypt(providerKey.encryptedKey),
      model: agent.model,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
    })

    // 4. Session & Message History
    const { session, chatSessionId } = await getOrCreateChatSession({
      providedSessionId,
      workspaceId: tenant.workspaceId,
      agentId: agent.id,
      visitorId,
      visitorEmail,
      ip,
      userAgent,
      origin,
      contextWindow: agent.contextWindow
    })

    if (!session) return NextResponse.json({ error: 'Session creation failed' }, { status: 500 })

    await saveUserMessage(chatSessionId!, message)

    // 5. Tool Registration & Prompt Builder
    const toolRegistry = new ToolRegistry()
    toolRegistry.registerMany(agent.tools)
    const toolExecutor = new ToolExecutor(toolRegistry)
    const mappedTools = agent.tools.map(t => ({ name: t.name, description: t.description, parameters: t.inputSchema as any }))

    const messages = buildMessageHistory(buildSystemPrompt(agent), session.messages, message)

    // 6. Streaming Controller
    const streamController = new StreamController(
      provider,
      messages,
      mappedTools.length > 0 ? mappedTools : undefined,
      {
        onChunk: async () => { },
        onToolCall: async (toolCall) => executeToolCall({
          toolCall,
          agent,
          chatSessionId: chatSessionId!,
          workspaceId: tenant.workspaceId,
          visitorId,
          origin,
          toolExecutor
        }),
        onComplete: async () => { },
        onError: (error) => console.error('Stream error:', error),
      }
    )

    let fullResponse = ''
    const stream = streamController.stream()

    const wrappedGenerator = async function* () {
      for await (const chunk of stream) {
        if (chunk.type === 'content' && chunk.content) fullResponse += chunk.content
        yield chunk
      }

      await saveAssistantMessage(chatSessionId!, fullResponse)
      await logUsageMetrics({ workspaceId: tenant.workspaceId, provider: agent.provider, model: agent.model, message, fullResponse, ip, userAgent, origin })
      await prisma.chatSession.update({ where: { id: chatSessionId! }, data: { updatedAt: new Date() } })
    }()

    return new Response(createSSEStream(wrappedGenerator), {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    })

  } catch (error) {
    console.error('[POST /api/chat] Fatal error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
