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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateChatMessage(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    const { agentId, sessionId: providedSessionId, message, visitorId, visitorEmail } = validation.data
    console.log(`[POST /api/chat] Incoming request for agent ${agentId} from visitor ${visitorId || 'unknown'}`)

    const authHeader = request.headers.get('authorization')
    let apiKeyWorkspaceId: string | undefined

    if (authHeader?.startsWith('Bearer ')) {
      const apiKey = authHeader.split(' ')[1]
      // In a real app, you'd hash this. For now assuming plain text or handled by lookup
      // Since schema has `key` and `hashedKey`, let's assume we look up by `key` directly for now if hashing isn't implemented in a util yet
      // But wait, schema has hashedKey. Let's look up by key for now or implement hashing.
      // Given I don't see a hashing util for API keys, I'll search by key directly if stored plainly, or assume we need to match.
      // actually schema says `key` @unique.
      const validKey = await prisma.apiKey.findUnique({
        where: { key: apiKey },
        include: { workspace: true }
      })

      if (validKey && validKey.isActive) {
        apiKeyWorkspaceId = validKey.workspaceId
        // Update last used
        await prisma.apiKey.update({
          where: { id: validKey.id },
          data: { lastUsedAt: new Date() }
        })
      } else {
        return NextResponse.json(
          { error: 'Invalid API Key' },
          { status: 401 }
        )
      }
    }

    const origin = request.headers.get('origin')
    const ip = request.headers.get('x-forwarded-for') || 'unknown'

    // Pass apiKeyWorkspaceId to resolveTenant or check after
    const tenant = await resolveTenant(agentId, origin || undefined)

    if (apiKeyWorkspaceId) {
      // If API key provided, ensure it matches the agent's workspace
      const agentCheck = await prisma.agent.findUnique({
        where: { id: agentId },
        select: { workspaceId: true }
      })
      if (agentCheck && agentCheck.workspaceId !== apiKeyWorkspaceId) {
        return NextResponse.json({ error: 'API Key does not belong to agent workspace' }, { status: 403 })
      }
    } else if (!tenant.isValid) {
      // If no API key and invalid tenant (origin mismatch), fail
      return NextResponse.json(
        { success: false, error: tenant.error || 'Invalid tenant' },
        { status: 403 }
      )
    }

    const rateLimit = await rateLimiter.checkAgent(agentId, ip)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', reset: rateLimit.reset },
        { status: 429 }
      )
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        workspace: true,
        tools: {
          where: { isActive: true },
        },
      },
    })

    if (agent) {
      console.log(`[POST /api/chat] Found agent ${agent.name} (ID: ${agent.id})`)
      console.log(`[POST /api/chat] Agent has ${agent.tools.length} active tools: ${agent.tools.map(t => t.name).join(', ')}`)
    }

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    const providerKey = await prisma.providerKey.findFirst({
      where: {
        workspaceId: tenant.workspaceId,
        provider: agent.provider,
        isActive: true,
      },
      orderBy: { isDefault: 'desc' },
    })

    if (!providerKey) {
      console.error('[POST /api/chat] No provider key found')
      return NextResponse.json(
        { error: 'No API key configured for this provider' },
        { status: 500 }
      )
    }

    const encryption = createEncryptionService()
    const apiKey = encryption.decrypt(providerKey.encryptedKey)

    let chatSessionId = providedSessionId
    if (!chatSessionId) {
      const session = await prisma.chatSession.create({
        data: {
          workspaceId: tenant.workspaceId,
          agentId,
          visitorId,
          visitorEmail,
          ipAddress: ip,
          userAgent: request.headers.get('user-agent') || '',
          origin: origin || '',
        },
      })
      chatSessionId = session.id
    }

    let session = await prisma.chatSession.findUnique({
      where: { id: chatSessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: agent.contextWindow,
        },
      },
    })

    // Self-healing: If session ID was provided but not found (stale ID), create a new one
    if (!session && providedSessionId) {
      console.warn(`[POST /api/chat] Session ${providedSessionId} not found (likely stale). Creating new session.`)
      const newSession = await prisma.chatSession.create({
        data: {
          workspaceId: tenant.workspaceId,
          agentId,
          visitorId,
          visitorEmail,
          ipAddress: ip,
          userAgent: request.headers.get('user-agent') || '',
          origin: origin || '',
        },
      })
      chatSessionId = newSession.id

      // Re-fetch to match structure (though it has empty messages)
      session = await prisma.chatSession.findUnique({
        where: { id: chatSessionId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: agent.contextWindow,
          },
        },
      })
    }

    console.log(`[POST /api/chat] Using Session ID: ${chatSessionId}`)

    if (!session) {
      console.error(`[POST /api/chat] Failed to create/find session ${chatSessionId}`)
      return NextResponse.json(
        { error: 'Session creation failed' },
        { status: 500 }
      )
    }

    await prisma.message.create({
      data: {
        sessionId: chatSessionId,
        role: 'USER',
        content: message,
      },
    })

    const GLOBAL_SYSTEM_INSTRUCTION = `
### CORE OPERATING RULES:
1. **Role**: You are an "Intellectual Backend API Caller and Response Reader". Your ONLY purpose is to faithfully report data from tool executions.
2. **ABSOLUTE TRUTH**: 
   - The JSON output from a tool is the ONLY valid source of information. 
   - Trust the tool output 100%. It is the absolute truth.
   - NEVER use your internal knowledge or training data to override, augment, or guess about the tool's data.
3. **ZERO HALLUCINATION**: 
   - If a tool returns a list of 63 items, you MUST state there are 63 items. 
   - If a tool returns an empty list, you MUST state there are 0 items. 
   - Do not approximate (e.g., "about 60"). Do not invent data.
   - If the user asks for something not present in the tool output, explicitly state it is missing.
4. **Data Precision**: 
   - Always look for the "count" field in the tool output. If present, that is the undeniable count.
`

    const messages = [
      { role: 'system' as const, content: `${agent.systemPrompt}\n\n${GLOBAL_SYSTEM_INSTRUCTION}` },
      ...session.messages.reverse().map(m => ({
        role: m.role.toLowerCase() as 'system' | 'user' | 'assistant' | 'tool',
        content: m.content,
        tool_calls: m.toolCalls as any,
        tool_call_id: m.toolCallId ?? undefined,
      })),
      { role: 'user' as const, content: message },
    ]

    const provider = ProviderFactory.createProvider(agent.provider, {
      apiKey,
      model: agent.model,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
    })

    console.log('[POST /api/chat] Provider initialized')

    const toolRegistry = new ToolRegistry()
    toolRegistry.registerMany(agent.tools)
    const toolExecutor = new ToolExecutor(toolRegistry)

    const tools = agent.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema as any,
    }))

    const streamController = new StreamController(
      provider,
      messages,
      tools.length > 0 ? tools : undefined,
      {
        onChunk: async (chunk) => {
        },
        onToolCall: async (toolCall) => {
          const tool = agent.tools.find(t => t.name.trim() === toolCall.function.name.trim())
          if (!tool) {
            return {
              success: false,
              data: null,
              error: `Tool not found: ${toolCall.function.name}`,
              latencyMs: 0,
            }
          }

          console.log(`[POST /api/chat] LLM requested tool execution: ${toolCall.function.name}`)
          console.log(`[POST /api/chat] Tool arguments:`, toolCall.function.arguments)

          const parameters = JSON.parse(toolCall.function.arguments || '{}')

          await prisma.toolExecution.create({
            data: {
              sessionId: chatSessionId,
              toolId: tool.id,
              input: parameters,
              status: 'RUNNING',
            },
          })

          const result = await toolExecutor.execute(tool.id, parameters, {
            sessionId: chatSessionId,
            agentId,
            workspaceId: tenant.workspaceId,
            visitorId,
            origin: origin || undefined,
          })

          console.log(`[POST /api/chat] Tool execution result for ${tool.name}:`, {
            success: result.success,
            latency: result.latencyMs,
            error: result.error,
            // Don't log full data if it's huge, but for debugging now it's fine
            dataPreview: JSON.stringify(result.data).substring(0, 200)
          })

          await prisma.toolExecution.updateMany({
            where: {
              sessionId: chatSessionId,
              toolId: tool.id,
            },
            data: {
              output: result.data,
              error: result.error,
              status: result.success ? 'SUCCESS' : 'FAILED',
              completedAt: new Date(),
              latencyMs: result.latencyMs,
            },
          })

          const sanitizedOutput = sanitizeToolOutput(result.data)
          const finalOutput = Array.isArray(sanitizedOutput)
            ? { count: sanitizedOutput.length, items: sanitizedOutput }
            : sanitizedOutput

          return {
            ...result,
            data: finalOutput,
          }
        },
        onComplete: async () => {
        },
        onError: (error) => {
          console.error('Stream error:', error)
        },
      }
    )

    let fullResponse = ''
    const stream = streamController.stream()

    const wrappedGenerator = async function* () {
      for await (const chunk of stream) {
        if (chunk.type === 'content' && chunk.content) {
          fullResponse += chunk.content
        }
        yield chunk
      }

      await prisma.message.create({
        data: {
          sessionId: chatSessionId,
          role: 'ASSISTANT',
          content: fullResponse,
        },
      })

      // Track usage
      const inputTokens = Math.ceil(message.length / 4)
      const outputTokens = Math.ceil(fullResponse.length / 4)

      await prisma.usageLog.create({
        data: {
          workspaceId: tenant.workspaceId,
          eventType: 'CHAT_MESSAGE',
          provider: agent.provider,
          model: agent.model,
          tokensInput: inputTokens,
          tokensOutput: outputTokens,
          ipAddress: ip,
          userAgent: request.headers.get('user-agent'),
          origin: origin || undefined,
        }
      })

      await prisma.chatSession.update({
        where: { id: chatSessionId },
        data: { updatedAt: new Date() },
      })
    }()

    console.log('[POST /api/chat] Starting stream')
    return new Response(createSSEStream(wrappedGenerator), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('[POST /api/chat] Fatal error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
